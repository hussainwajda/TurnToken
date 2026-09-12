from fastapi import APIRouter, Depends, HTTPException

from app.auth import get_current_user_id, require_business_owner
from app.models.schemas import CounterState, QueueResponse, Token, TokenStatus
from app.services import eta
from app.services.catalog import hydrate_token, load_counters, load_token_services
from app.supabase_client import get_supabase

router = APIRouter(prefix="/api/business", tags=["queue"])


@router.get("/{business_id}/queue", response_model=QueueResponse)
def get_queue(business_id: str, user_id: str = Depends(get_current_user_id)) -> QueueResponse:
    supabase = get_supabase()
    require_business_owner(supabase, business_id, user_id)

    business_row = (
        supabase.table("businesses")
        .select("default_service_time_minutes")
        .eq("id", business_id)
        .maybe_single()
        .execute()
    )
    if not business_row or not business_row.data:
        raise HTTPException(status_code=404, detail="Business not found")
    default_minutes = business_row.data["default_service_time_minutes"]

    active = (
        supabase.table("tokens")
        .select("*")
        .eq("business_id", business_id)
        .in_(
            "status",
            [
                TokenStatus.waiting.value,
                TokenStatus.called.value,
                TokenStatus.skipped.value,
                TokenStatus.restored.value,
            ],
        )
        .order("position")
        .execute()
        .data
        or []
    )

    services_by_token = load_token_services(supabase, [row["id"] for row in active])
    hydrated = [hydrate_token(row, services_by_token) for row in active]

    waiting_rows = [
        row for row in hydrated if row["status"] in ("waiting", "restored")
    ]
    called_rows = [row for row in hydrated if row["status"] == "called"]
    skipped_rows = [row for row in hydrated if row["status"] == "skipped"]

    rolling = eta.compute_service_rolling_averages(supabase, business_id)
    counters = load_counters(supabase, business_id)
    called_by_counter = {row["counter_id"]: row for row in called_rows if row["counter_id"]}

    counter_finish_times = {c["id"]: 0.0 for c in counters if c["active"]}
    for counter_id, row in called_by_counter.items():
        if counter_id in counter_finish_times:
            counter_finish_times[counter_id] = eta.counter_busy_until_minutes(
                row["services"], row["called_at"], default_minutes, rolling
            )
    allowed_by_counter = {
        c["id"]: set(c["allowed_service_ids"]) for c in counters if c["active"]
    }

    def eligible_counters(service_ids: set[str]) -> list[str]:
        if not service_ids:
            return list(counter_finish_times.keys())
        matches = [
            cid for cid, allow in allowed_by_counter.items() if not allow or service_ids <= allow
        ]
        return matches or list(counter_finish_times.keys())

    waiting: list[Token] = []
    for row in waiting_rows:
        duration = eta.ticket_duration_minutes(row["services"], default_minutes, rolling)
        service_ids = {s["service_id"] for s in row["services"] if s["service_id"]}
        wait = 0.0
        if counter_finish_times:
            candidates = eligible_counters(service_ids)
            target = min(candidates, key=lambda cid: counter_finish_times[cid])
            wait = counter_finish_times[target]
            counter_finish_times[target] += duration
        waiting.append(Token(**row, estimated_wait_minutes=round(wait, 1)))

    skipped = [Token(**row) for row in skipped_rows]

    counter_states = [
        CounterState(
            id=c["id"],
            label=c["label"],
            active=c["active"],
            allowed_service_ids=c["allowed_service_ids"],
            current_token=(
                Token(**called_by_counter[c["id"]]) if c["id"] in called_by_counter else None
            ),
        )
        for c in counters
    ]

    return QueueResponse(
        business_id=business_id, counters=counter_states, waiting=waiting, skipped=skipped
    )
