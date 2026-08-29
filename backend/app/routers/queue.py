from fastapi import APIRouter, Depends, HTTPException

from app.auth import get_current_user_id, require_business_owner
from app.models.schemas import QueueResponse, Token, TokenStatus
from app.supabase_client import get_supabase

router = APIRouter(prefix="/api/business", tags=["queue"])


@router.get("/{business_id}/queue", response_model=QueueResponse)
def get_queue(business_id: str, user_id: str = Depends(get_current_user_id)) -> QueueResponse:
    supabase = get_supabase()
    require_business_owner(supabase, business_id, user_id)

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
    )
    if active.data is None:
        raise HTTPException(status_code=404, detail="Business not found")

    tokens = [Token(**row) for row in active.data]
    serving = next((t for t in tokens if t.status == TokenStatus.called), None)

    return QueueResponse(business_id=business_id, tokens=tokens, currently_serving=serving)
