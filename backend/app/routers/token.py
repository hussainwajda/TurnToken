from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from app.auth import get_current_user_id, require_business_owner
from app.config import get_settings
from app.models.schemas import Token, TokenCreate, TokenStatus, TokenStatusResponse
from app.services import eta
from app.services.catalog import hydrate_token, load_counters, load_token_services
from app.services.push import send_push_to_token
from app.services.ratelimit import cancel_token_limiter, issue_token_limiter
from app.services.realtime import notify_business
from app.supabase_client import get_supabase

router = APIRouter(tags=["token"])


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


@router.post(
    "/api/business/{business_id}/token",
    response_model=Token,
    dependencies=[Depends(issue_token_limiter)],
)
def issue_token(business_id: str, payload: TokenCreate | None = None) -> Token:
    supabase = get_supabase()
    payload = payload or TokenCreate()

    business = (
        supabase.table("businesses").select("*").eq("id", business_id).maybe_single().execute()
    )
    if not business or not business.data:
        raise HTTPException(status_code=404, detail="Business not found")
    if business.data.get("is_paused"):
        raise HTTPException(status_code=409, detail="This queue is paused right now")

    services: list[dict] = []
    if payload.service_ids:
        rows = (
            supabase.table("services")
            .select("id,name,estimated_minutes,active")
            .eq("business_id", business_id)
            .in_("id", payload.service_ids)
            .execute()
            .data
            or []
        )
        found_ids = {row["id"] for row in rows}
        if found_ids != set(payload.service_ids) or any(not row["active"] for row in rows):
            raise HTTPException(status_code=400, detail="One or more services are unavailable")
        services = rows

    last = (
        supabase.table("tokens")
        .select("position")
        .eq("business_id", business_id)
        .order("position", desc=True)
        .limit(1)
        .execute()
    )
    next_position = (last.data[0]["position"] + 1) if last.data else 1

    result = (
        supabase.table("tokens")
        .insert(
            {
                "business_id": business_id,
                "position": next_position,
                "status": TokenStatus.waiting.value,
            }
        )
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=500, detail="Could not issue token")
    token_row = result.data[0]

    if services:
        supabase.table("token_services").insert(
            [
                {
                    "token_id": token_row["id"],
                    "service_id": s["id"],
                    "service_name": s["name"],
                    "estimated_minutes": s["estimated_minutes"],
                }
                for s in services
            ]
        ).execute()

    notify_business(business_id, "token_issued")
    return Token(
        **hydrate_token(
            token_row, load_token_services(supabase, [token_row["id"]])
        )
    )


@router.get("/api/token/{token_id}/status", response_model=TokenStatusResponse)
def token_status(token_id: str) -> TokenStatusResponse:
    supabase = get_supabase()

    token_row = supabase.table("tokens").select("*").eq("id", token_id).maybe_single().execute()
    if not token_row or not token_row.data:
        raise HTTPException(status_code=404, detail="Token not found")
    token_row = token_row.data

    business_row = (
        supabase.table("businesses")
        .select("*")
        .eq("id", token_row["business_id"])
        .maybe_single()
        .execute()
    )
    if not business_row or not business_row.data:
        raise HTTPException(status_code=404, detail="Business not found")
    business = business_row.data

    my_services = load_token_services(supabase, [token_id]).get(token_id, [])
    token = Token(**hydrate_token(token_row, {token_id: my_services}))

    ahead_rows = (
        supabase.table("tokens")
        .select("id,position")
        .eq("business_id", token.business_id)
        .lt("position", token.position)
        .in_("status", [TokenStatus.waiting.value, TokenStatus.restored.value])
        .order("position")
        .execute()
        .data
        or []
    )
    tokens_ahead = len(ahead_rows)

    counter_label = None
    estimated_wait = 0.0
    if token.status in (TokenStatus.waiting, TokenStatus.restored):
        rolling = eta.compute_service_rolling_averages(supabase, token.business_id)
        default_minutes = business["default_service_time_minutes"]

        ahead_services = load_token_services(supabase, [row["id"] for row in ahead_rows])
        ahead = [
            {
                "duration": eta.ticket_duration_minutes(
                    ahead_services.get(row["id"], []), default_minutes, rolling
                ),
                "service_ids": {
                    s["service_id"] for s in ahead_services.get(row["id"], []) if s["service_id"]
                },
            }
            for row in ahead_rows
        ]

        counters = load_counters(supabase, token.business_id)
        counter_specs = _counter_specs(supabase, counters, default_minutes, rolling)

        my_duration = eta.ticket_duration_minutes(my_services, default_minutes, rolling)
        my_service_ids = {s["service_id"] for s in my_services if s["service_id"]}
        estimated_wait = eta.simulate_wait_minutes(my_duration, my_service_ids, ahead, counter_specs)
    elif token.status == TokenStatus.called and token.counter_id:
        counter_row = (
            supabase.table("counters")
            .select("label")
            .eq("id", token.counter_id)
            .maybe_single()
            .execute()
        )
        if counter_row and counter_row.data:
            counter_label = counter_row.data["label"]

    return TokenStatusResponse(
        token=token,
        position_in_queue=token.position,
        tokens_ahead=tokens_ahead,
        estimated_wait_minutes=round(estimated_wait, 1),
        counter_label=counter_label,
    )


def _counter_specs(
    supabase, counters: list[dict], default_minutes: float, rolling: dict[str, float]
) -> list[dict]:
    """Builds the {id, allowed_service_ids, busy_until} shape simulate_wait_minutes
    needs, resolving each active counter's current occupant (if any)."""
    active = [c for c in counters if c["active"]]
    if not active:
        return []

    called = (
        supabase.table("tokens")
        .select("id,counter_id,called_at")
        .in_("counter_id", [c["id"] for c in active])
        .eq("status", "called")
        .execute()
        .data
        or []
    )
    services_by_token = load_token_services(supabase, [row["id"] for row in called])
    busy_by_counter = {
        row["counter_id"]: eta.counter_busy_until_minutes(
            services_by_token.get(row["id"], []), row["called_at"], default_minutes, rolling
        )
        for row in called
    }

    return [
        {
            "id": c["id"],
            "allowed_service_ids": set(c["allowed_service_ids"]),
            "busy_until": busy_by_counter.get(c["id"], 0.0),
        }
        for c in active
    ]


@router.post("/api/token/{token_id}/call", response_model=Token)
def call_token(
    token_id: str, counter_id: str, user_id: str = Depends(get_current_user_id)
) -> Token:
    supabase = get_supabase()
    current = supabase.table("tokens").select("*").eq("id", token_id).maybe_single().execute()
    if not current or not current.data:
        raise HTTPException(status_code=404, detail="Token not found")
    business_id = current.data["business_id"]
    require_business_owner(supabase, business_id, user_id)

    counter = (
        supabase.table("counters")
        .select("*")
        .eq("id", counter_id)
        .eq("business_id", business_id)
        .maybe_single()
        .execute()
    )
    if not counter or not counter.data:
        raise HTTPException(status_code=404, detail="Counter not found")
    if not counter.data["active"]:
        raise HTTPException(status_code=409, detail="This counter is disabled")

    busy = (
        supabase.table("tokens")
        .select("id")
        .eq("counter_id", counter_id)
        .eq("status", "called")
        .limit(1)
        .execute()
    )
    if busy.data:
        raise HTTPException(status_code=409, detail="This counter is already serving someone")

    allowed = load_counters(supabase, business_id)
    allowed_ids = next(
        (set(c["allowed_service_ids"]) for c in allowed if c["id"] == counter_id), set()
    )
    if allowed_ids:
        my_services = load_token_services(supabase, [token_id]).get(token_id, [])
        my_service_ids = {s["service_id"] for s in my_services if s["service_id"]}
        if my_service_ids and not my_service_ids <= allowed_ids:
            raise HTTPException(
                status_code=409, detail="This counter can't serve this ticket's services"
            )

    token = _transition(
        token_id,
        from_statuses=[TokenStatus.waiting, TokenStatus.restored],
        to_status=TokenStatus.called,
        timestamp_field="called_at",
        owner_id=user_id,
        extra_fields={"counter_id": counter_id},
    )
    send_push_to_token(
        get_supabase(),
        token_id,
        title="You're up!",
        body=f"Ticket #{token.position:03d} — head to {counter.data['label']} now.",
        url=f"{get_settings().frontend_url}/status/{token_id}",
    )
    return token


@router.post("/api/token/{token_id}/serve", response_model=Token)
def serve_token(token_id: str, user_id: str = Depends(get_current_user_id)) -> Token:
    return _transition(
        token_id,
        from_statuses=[TokenStatus.called],
        to_status=TokenStatus.done,
        timestamp_field="served_at",
        owner_id=user_id,
    )


@router.post("/api/token/{token_id}/skip", response_model=Token)
def skip_token(token_id: str, user_id: str = Depends(get_current_user_id)) -> Token:
    return _transition(
        token_id,
        from_statuses=[TokenStatus.called],
        to_status=TokenStatus.skipped,
        timestamp_field="skipped_at",
        owner_id=user_id,
    )


@router.post("/api/token/{token_id}/restore", response_model=Token)
def restore_token(token_id: str, user_id: str = Depends(get_current_user_id)) -> Token:
    return _transition(
        token_id,
        from_statuses=[TokenStatus.skipped],
        to_status=TokenStatus.restored,
        timestamp_field="restored_at",
        owner_id=user_id,
    )


@router.post(
    "/api/token/{token_id}/cancel",
    response_model=Token,
    dependencies=[Depends(cancel_token_limiter)],
)
def cancel_token(token_id: str) -> Token:
    """Customer self-service: cancelling your own place in line needs no
    login, per the state machine's "Waiting -> Customer cancels" rule."""
    return _transition(
        token_id,
        from_statuses=[TokenStatus.waiting],
        to_status=TokenStatus.cancelled,
        timestamp_field=None,
    )


def _transition(
    token_id: str,
    from_statuses: list[TokenStatus],
    to_status: TokenStatus,
    timestamp_field: str | None,
    owner_id: str | None = None,
    extra_fields: dict | None = None,
) -> Token:
    supabase = get_supabase()
    current = supabase.table("tokens").select("*").eq("id", token_id).maybe_single().execute()
    if not current or not current.data:
        raise HTTPException(status_code=404, detail="Token not found")

    if owner_id is not None:
        require_business_owner(supabase, current.data["business_id"], owner_id)

    if current.data["status"] not in [s.value for s in from_statuses]:
        raise HTTPException(
            status_code=409,
            detail=f"Cannot move token from {current.data['status']} to {to_status.value}",
        )

    update = {"status": to_status.value, **(extra_fields or {})}
    if timestamp_field:
        update[timestamp_field] = _now()

    result = supabase.table("tokens").update(update).eq("id", token_id).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Could not update token")
    notify_business(current.data["business_id"], "token_updated")
    token_row = result.data[0]
    return Token(**hydrate_token(token_row, load_token_services(supabase, [token_id])))
