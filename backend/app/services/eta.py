"""Multi-counter, per-service ETA engine.

The PRD's original formula, ``(tokens_ahead / active_counters) * average``,
assumes every ticket takes the same time. That stops holding the moment a
business lets customers combine services (a haircut is 15 minutes, a
haircut + beard trim is 25) — a shop-wide average either overestimates the
quick tickets or underestimates the long ones.

Instead this module runs a small list-scheduling simulation: each counter
tracks the (estimated) minute it next becomes free, and every ticket ahead
of you in the queue gets greedily assigned, in queue order, to whichever
counter eligible to serve it frees up soonest. Your ETA is just where you
land once every ticket ahead of you has been placed. This is the standard
greedy approximation for minimizing makespan on unrelated parallel
machines (Graham's list scheduling) applied to a live queue, and it
naturally accounts for heterogeneous service durations, counters that are
mid-service right now, and counters restricted to a subset of services.

Per-service rolling averages replace the old single shop-wide rolling
average: when a multi-service ticket completes, its total Called-to-Done
duration is attributed across its services proportionally to each
service's estimated share, so a slow haircut+beard day nudges the haircut
average without needing the two services to ever occur alone.
"""

from datetime import datetime, timezone

from supabase import Client

ROLLING_WINDOW = 12


def _elapsed_minutes(since: str) -> float:
    started = datetime.fromisoformat(since)
    return (datetime.now(timezone.utc) - started).total_seconds() / 60


def compute_service_rolling_averages(supabase: Client, business_id: str) -> dict[str, float]:
    """Attributed rolling-average minutes per service_id, from recently
    completed tickets. A service with no history yet is simply absent from
    the returned dict — callers fall back to its catalog estimate."""
    completed = (
        supabase.table("tokens")
        .select("id,called_at,served_at")
        .eq("business_id", business_id)
        .eq("status", "done")
        .not_.is_("called_at", "null")
        .not_.is_("served_at", "null")
        .order("served_at", desc=True)
        .limit(60)
        .execute()
        .data
        or []
    )
    if not completed:
        return {}

    duration_by_token = {
        row["id"]: (
            datetime.fromisoformat(row["served_at"]) - datetime.fromisoformat(row["called_at"])
        ).total_seconds()
        / 60
        for row in completed
    }

    service_rows = (
        supabase.table("token_services")
        .select("token_id,service_id,estimated_minutes")
        .in_("token_id", list(duration_by_token.keys()))
        .execute()
        .data
        or []
    )
    by_token: dict[str, list[dict]] = {}
    for row in service_rows:
        by_token.setdefault(row["token_id"], []).append(row)

    samples: dict[str, list[float]] = {}
    for token_id, duration in duration_by_token.items():
        rows = by_token.get(token_id)
        if not rows:
            continue  # a plain, catalog-less ticket — nothing to attribute
        weight_total = sum(r["estimated_minutes"] for r in rows) or len(rows)
        for row in rows:
            service_id = row.get("service_id")
            if not service_id:
                continue
            weight = (row["estimated_minutes"] / weight_total) if weight_total else (1 / len(rows))
            samples.setdefault(service_id, []).append(duration * weight)

    return {
        service_id: sum(values[-ROLLING_WINDOW:]) / len(values[-ROLLING_WINDOW:])
        for service_id, values in samples.items()
        if values
    }


def ticket_duration_minutes(
    services: list[dict],
    default_service_time_minutes: float,
    rolling_averages: dict[str, float],
) -> float:
    """Expected minutes to serve one ticket, given the services it
    requested (as snapshot dicts with service_id/estimated_minutes)."""
    if not services:
        return default_service_time_minutes
    total = 0.0
    for service in services:
        service_id = service.get("service_id")
        fallback = service["estimated_minutes"]
        total += rolling_averages.get(service_id, fallback) if service_id else fallback
    return total


def counter_busy_until_minutes(
    current_token_services: list[dict] | None,
    called_at: str | None,
    default_service_time_minutes: float,
    rolling_averages: dict[str, float],
) -> float:
    """Minutes from now until a counter currently serving someone is
    expected to free up. 0 for an idle counter."""
    if current_token_services is None or not called_at:
        return 0.0
    expected = ticket_duration_minutes(
        current_token_services, default_service_time_minutes, rolling_averages
    )
    remaining = expected - _elapsed_minutes(called_at)
    return max(0.0, remaining)


def simulate_wait_minutes(
    my_duration_minutes: float,
    my_service_ids: set[str],
    ahead: list[dict],
    counters: list[dict],
) -> float:
    """Greedy list-scheduling simulation.

    ``ahead`` is the list of waiting/restored tickets in front of this one,
    in queue order, each ``{"duration": float, "service_ids": set[str]}``.

    ``counters`` is this business's counters, each
    ``{"id": str, "allowed_service_ids": set[str], "busy_until": float}``
    — an empty ``allowed_service_ids`` means the counter is unrestricted.
    """
    if not counters:
        counters = [{"id": None, "allowed_service_ids": set(), "busy_until": 0.0}]

    finish_times = {c["id"]: c["busy_until"] for c in counters}
    allowed = {c["id"]: c["allowed_service_ids"] for c in counters}

    def eligible(service_ids: set[str]) -> list:
        if not service_ids:
            return list(finish_times.keys())
        matches = [cid for cid, allow in allowed.items() if not allow or service_ids <= allow]
        # A misconfigured combo with no capable counter still gets served
        # eventually — degrade to "any counter" rather than wait forever.
        return matches or list(finish_times.keys())

    for item in ahead:
        candidates = eligible(item["service_ids"])
        target = min(candidates, key=lambda cid: finish_times[cid])
        finish_times[target] += item["duration"]

    candidates = eligible(my_service_ids)
    return min(finish_times[cid] for cid in candidates)


def estimate_wait_minutes(
    tokens_ahead: int,
    active_counters: int,
    recent_service_minutes: list[float],
    default_service_time_minutes: float,
) -> float:
    """Simple shop-wide fallback, kept for callers with no per-ticket
    service/counter detail available (e.g. a cold-start estimate)."""
    if active_counters <= 0:
        active_counters = 1

    if recent_service_minutes:
        sample = recent_service_minutes[-ROLLING_WINDOW:]
        avg_service_minutes = sum(sample) / len(sample)
    else:
        avg_service_minutes = default_service_time_minutes

    return (tokens_ahead / active_counters) * avg_service_minutes
