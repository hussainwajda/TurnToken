from collections import Counter
from datetime import datetime, time, timezone

from fastapi import APIRouter, Depends

from app.auth import get_current_user_id, require_business_owner
from app.models.schemas import AnalyticsResponse, ServiceBreakdown
from app.supabase_client import get_supabase

router = APIRouter(prefix="/api/business", tags=["analytics"])


def _start_of_today() -> datetime:
    now = datetime.now(timezone.utc)
    return datetime.combine(now.date(), time.min, tzinfo=timezone.utc)


@router.get("/{business_id}/analytics", response_model=AnalyticsResponse)
def get_analytics(
    business_id: str, user_id: str = Depends(get_current_user_id)
) -> AnalyticsResponse:
    supabase = get_supabase()
    require_business_owner(supabase, business_id, user_id)

    start_of_day = _start_of_today()

    today_tokens = (
        supabase.table("tokens")
        .select("status,created_at,served_at,skipped_at,expired_at")
        .eq("business_id", business_id)
        .gte("created_at", start_of_day.isoformat())
        .execute()
        .data
        or []
    )

    served_today = [t for t in today_tokens if t["status"] == "done" and t["served_at"]]
    wait_minutes = [
        (datetime.fromisoformat(t["served_at"]) - datetime.fromisoformat(t["created_at"])).total_seconds()
        / 60
        for t in served_today
    ]
    average_wait_minutes = round(sum(wait_minutes) / len(wait_minutes), 1) if wait_minutes else 0.0

    hour_counts = Counter(
        datetime.fromisoformat(t["created_at"]).hour for t in today_tokens
    )
    peak_hour = max(hour_counts, key=lambda h: hour_counts[h]) if hour_counts else None

    no_show_count = sum(1 for t in today_tokens if t["status"] == "expired")
    no_show_rate = round(no_show_count / len(today_tokens), 3) if today_tokens else 0.0

    waiting_now = (
        supabase.table("tokens")
        .select("id", count="exact")
        .eq("business_id", business_id)
        .in_("status", ["waiting", "restored"])
        .execute()
        .count
        or 0
    )

    top_services = _top_services(supabase, business_id, start_of_day)

    return AnalyticsResponse(
        business_id=business_id,
        date=start_of_day.date().isoformat(),
        customers_served=len(served_today),
        average_wait_minutes=average_wait_minutes,
        peak_hour=peak_hour,
        no_show_count=no_show_count,
        no_show_rate=no_show_rate,
        waiting_now=waiting_now,
        top_services=top_services,
    )


def _top_services(supabase, business_id: str, start_of_day: datetime) -> list[ServiceBreakdown]:
    done_today = (
        supabase.table("tokens")
        .select("id,called_at,served_at")
        .eq("business_id", business_id)
        .eq("status", "done")
        .gte("created_at", start_of_day.isoformat())
        .execute()
        .data
        or []
    )
    if not done_today:
        return []

    duration_by_token = {
        t["id"]: (
            datetime.fromisoformat(t["served_at"]) - datetime.fromisoformat(t["called_at"])
        ).total_seconds()
        / 60
        for t in done_today
        if t.get("called_at") and t.get("served_at")
    }

    service_rows = (
        supabase.table("token_services")
        .select("token_id,service_name,estimated_minutes")
        .in_("token_id", [t["id"] for t in done_today])
        .execute()
        .data
        or []
    )

    totals: dict[str, list[float]] = {}
    for row in service_rows:
        duration = duration_by_token.get(row["token_id"])
        if duration is None:
            continue
        totals.setdefault(row["service_name"], []).append(duration)

    breakdown = [
        ServiceBreakdown(
            service_name=name, count=len(durations), average_minutes=round(sum(durations) / len(durations), 1)
        )
        for name, durations in totals.items()
    ]
    breakdown.sort(key=lambda item: item.count, reverse=True)
    return breakdown[:5]
