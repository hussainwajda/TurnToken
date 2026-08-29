from fastapi import APIRouter, HTTPException

from app.config import get_settings
from app.models.schemas import PushSubscriptionCreate
from app.supabase_client import get_supabase

router = APIRouter(tags=["push"])


@router.get("/api/push/public-key")
def get_public_key() -> dict:
    return {"public_key": get_settings().vapid_public_key}


@router.post("/api/token/{token_id}/push-subscribe")
def subscribe(token_id: str, payload: PushSubscriptionCreate) -> dict:
    """Public: a customer opts in to browser push from their own status
    page. No login involved, same as the rest of the customer flow."""
    supabase = get_supabase()

    token = supabase.table("tokens").select("id").eq("id", token_id).single().execute()
    if not token.data:
        raise HTTPException(status_code=404, detail="Token not found")

    supabase.table("push_subscriptions").upsert(
        {
            "token_id": token_id,
            "endpoint": payload.endpoint,
            "p256dh": payload.p256dh,
            "auth": payload.auth,
        },
        on_conflict="token_id,endpoint",
    ).execute()
    return {"subscribed": True}
