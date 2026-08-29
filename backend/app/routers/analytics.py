from collections import Counter
from datetime import datetime, time, timezone

from fastapi import APIRouter, Depends

from app.auth import get_current_user_id, require_business_owner
from app.models.schemas import AnalyticsResponse
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

    return AnalyticsResponse(
        business_id=business_id,
        date=start_of_day.date().isoformat(),
        customers_served=len(served_today),
        average_wait_minutes=average_wait_minutes,
        peak_hour=peak_hour,
        no_show_count=no_show_count,
        no_show_rate=no_show_rate,
        waiting_now=waiting_now,
    )
