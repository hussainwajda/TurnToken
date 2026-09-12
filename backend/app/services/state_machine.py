"""Automatic no-show enforcement and "almost up" alerts, per PRD sections
6.5 and 8.

The owner never decides whether a late customer keeps their place: a
called token past the business's grace timer is auto-skipped, and a
skipped token past the hold window is auto-expired. This sweep also owns
the one alert that has no natural trigger point elsewhere in the API —
"almost up" fires when a waiting token's position crosses the business's
configured threshold, which only changes as *other* tokens move.
"""

import logging
from datetime import datetime, timezone

from supabase import Client

from app.config import get_settings
from app.services.push import send_push_to_token
from app.services.realtime import notify_business

logger = logging.getLogger("turn_token.state_machine")


def _elapsed_minutes(since: str | None) -> float:
    if not since:
        return 0.0
    started = datetime.fromisoformat(since)
    return (datetime.now(timezone.utc) - started).total_seconds() / 60


def sweep_expirations(supabase: Client) -> dict[str, int]:
    """Runs one pass over all businesses; returns counts of transitions made."""
    skipped_count = 0
    expired_count = 0
    almost_up_count = 0

    businesses = supabase.table("businesses").select(
        "id,grace_timer_minutes,hold_window_minutes,almost_up_threshold"
    ).execute().data or []

    for business in businesses:
        changed = False

        called = (
            supabase.table("tokens")
            .select("id,called_at")
            .eq("business_id", business["id"])
            .eq("status", "called")
            .execute()
            .data
            or []
        )
        for token in called:
            if _elapsed_minutes(token["called_at"]) >= business["grace_timer_minutes"]:
                supabase.table("tokens").update(
                    {"status": "skipped", "skipped_at": _now()}
                ).eq("id", token["id"]).execute()
                skipped_count += 1
                changed = True

        skipped = (
            supabase.table("tokens")
            .select("id,skipped_at")
            .eq("business_id", business["id"])
            .eq("status", "skipped")
            .execute()
            .data
            or []
        )
        for token in skipped:
            if _elapsed_minutes(token["skipped_at"]) >= business["hold_window_minutes"]:
                supabase.table("tokens").update(
                    {"status": "expired", "expired_at": _now()}
                ).eq("id", token["id"]).execute()
                expired_count += 1
                changed = True

        almost_up_count += _sweep_almost_up(supabase, business)

        # The owner dashboard and the affected customers' tickets never
        # made these transitions themselves — this is the one place a
        # queue change happens with no request to hang a broadcast off,
        # so it's pushed explicitly instead.
        if changed:
            notify_business(business["id"], "token_updated")

    if skipped_count or expired_count or almost_up_count:
        logger.info(
            "state machine sweep: %d skipped, %d expired, %d almost-up alerts",
            skipped_count,
            expired_count,
            almost_up_count,
        )

    return {"skipped": skipped_count, "expired": expired_count, "almost_up": almost_up_count}


def _sweep_almost_up(supabase: Client, business: dict) -> int:
    threshold = business["almost_up_threshold"]
    if threshold <= 0:
        return 0

    active = (
        supabase.table("tokens")
        .select("id,position,status")
        .eq("business_id", business["id"])
        .in_("status", ["waiting", "called", "restored"])
        .order("position")
        .execute()
        .data
        or []
    )

    sent = 0
    for index, token in enumerate(active):
        if token["status"] not in ("waiting", "restored"):
            continue
        tokens_ahead = index
        if tokens_ahead > threshold:
            continue

        already_sent = (
            supabase.table("notification_log")
            .select("id")
            .eq("token_id", token["id"])
            .eq("type", "almost_up")
            .limit(1)
            .execute()
            .data
        )
        if already_sent:
            continue

        send_push_to_token(
            supabase,
            token["id"],
            title="Almost your turn",
            body=f"Only {tokens_ahead} {'person' if tokens_ahead == 1 else 'people'} ahead of you now.",
            url=f"{get_settings().frontend_url}/status/{token['id']}",
        )
        supabase.table("notification_log").insert(
            {"token_id": token["id"], "channel": "push", "type": "almost_up"}
        ).execute()
        sent += 1

    return sent


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()
