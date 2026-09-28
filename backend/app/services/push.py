"""Browser push delivery, per PRD section 6.5's "browser push" channel.

WhatsApp is a customer-initiated deep link (see the frontend status page)
since the free tier has no WhatsApp Business API access; push is the one
channel this backend can actually deliver proactively.
"""

import json
import logging

from pywebpush import WebPushException, webpush
from supabase import Client

from app.config import get_settings

logger = logging.getLogger("turn_token.push")


def send_push_to_token(
    supabase: Client, token_id: str, title: str, body: str, url: str | None = None
) -> None:
    settings = get_settings()
    if not settings.vapid_private_key:
        # Previously a silent no-op — logged so a missing/stale VAPID key
        # (e.g. added to .env after the server was already running; uvicorn
        # --reload only watches .py files, not .env) shows up somewhere
        # instead of looking like push just isn't firing for no reason.
        logger.warning(
            "skipping push for token %s: VAPID_PRIVATE_KEY not configured", token_id
        )
        return

    subs = (
        supabase.table("push_subscriptions")
        .select("*")
        .eq("token_id", token_id)
        .execute()
        .data
        or []
    )
    if not subs:
        logger.info("no push subscriptions for token %s, nothing to send", token_id)
        return

    payload = {"title": title, "body": body}
    if url:
        payload["url"] = url

    for sub in subs:
        try:
            webpush(
                subscription_info={
                    "endpoint": sub["endpoint"],
                    "keys": {"p256dh": sub["p256dh"], "auth": sub["auth"]},
                },
                data=json.dumps(payload),
                vapid_private_key=settings.vapid_private_key,
                vapid_claims={"sub": f"mailto:{settings.vapid_contact_email}"},
            )
            logger.info("push delivered for token %s to subscription %s", token_id, sub["id"])
        except WebPushException as exc:
            logger.warning("push delivery failed for token %s: %s", token_id, exc)
            if exc.response is not None and exc.response.status_code in (404, 410):
                supabase.table("push_subscriptions").delete().eq("id", sub["id"]).execute()
