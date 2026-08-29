from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from app.auth import get_current_user_id, require_business_owner
from app.models.schemas import Token, TokenStatus, TokenStatusResponse
from app.services.eta import estimate_wait_minutes
from app.services.push import send_push_to_token
from app.supabase_client import get_supabase

router = APIRouter(tags=["token"])


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


@router.post("/api/business/{business_id}/token", response_model=Token)
def issue_token(business_id: str) -> Token:
    supabase = get_supabase()

    business = (
        supabase.table("businesses").select("*").eq("id", business_id).single().execute()
    )
    if not business.data:
        raise HTTPException(status_code=404, detail="Business not found")
    if business.data.get("is_paused"):
        raise HTTPException(status_code=409, detail="This queue is paused right now")

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
    return Token(**result.data[0])


@router.get("/api/token/{token_id}/status", response_model=TokenStatusResponse)
def token_status(token_id: str) -> TokenStatusResponse:
    supabase = get_supabase()

    token_row = supabase.table("tokens").select("*").eq("id", token_id).single().execute()
    if not token_row.data:
        raise HTTPException(status_code=404, detail="Token not found")
    token = Token(**token_row.data)

    business_row = (
        supabase.table("businesses").select("*").eq("id", token.business_id).single().execute()
    )
    if not business_row.data:
        raise HTTPException(status_code=404, detail="Business not found")
    business = business_row.data

    ahead = (
        supabase.table("tokens")
        .select("id", count="exact")
        .eq("business_id", token.business_id)
        .lt("position", token.position)
        .in_("status", [TokenStatus.waiting.value, TokenStatus.called.value])
        .execute()
    )
    tokens_ahead = ahead.count or 0

    recent = (
        supabase.table("tokens")
        .select("called_at,served_at")
        .eq("business_id", token.business_id)
        .eq("status", TokenStatus.done.value)
        .order("served_at", desc=True)
        .limit(12)
        .execute()
    )
    recent_minutes = [
        (
            datetime.fromisoformat(row["served_at"]) - datetime.fromisoformat(row["called_at"])
        ).total_seconds()
        / 60
        for row in (recent.data or [])
        if row.get("called_at") and row.get("served_at")
    ]

    eta = estimate_wait_minutes(
        tokens_ahead=tokens_ahead,
        active_counters=business["active_counters"],
        recent_service_minutes=recent_minutes,
        default_service_time_minutes=business["default_service_time_minutes"],
    )

    return TokenStatusResponse(
        token=token,
        position_in_queue=token.position,
        tokens_ahead=tokens_ahead,
        estimated_wait_minutes=round(eta, 1),
    )


@router.post("/api/token/{token_id}/call", response_model=Token)
def call_token(token_id: str, user_id: str = Depends(get_current_user_id)) -> Token:
    token = _transition(
        token_id,
        from_statuses=[TokenStatus.waiting, TokenStatus.restored],
        to_status=TokenStatus.called,
        timestamp_field="called_at",
        owner_id=user_id,
    )
    send_push_to_token(
        get_supabase(),
        token_id,
        title="You're up!",
        body=f"Ticket #{token.position:03d} — head to the counter now.",
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


@router.post("/api/token/{token_id}/cancel", response_model=Token)
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
) -> Token:
    supabase = get_supabase()
    current = supabase.table("tokens").select("*").eq("id", token_id).single().execute()
    if not current.data:
        raise HTTPException(status_code=404, detail="Token not found")

    if owner_id is not None:
        require_business_owner(supabase, current.data["business_id"], owner_id)

    if current.data["status"] not in [s.value for s in from_statuses]:
        raise HTTPException(
            status_code=409,
            detail=f"Cannot move token from {current.data['status']} to {to_status.value}",
        )

    update = {"status": to_status.value}
    if timestamp_field:
        update[timestamp_field] = _now()

    result = supabase.table("tokens").update(update).eq("id", token_id).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Could not update token")
    return Token(**result.data[0])
