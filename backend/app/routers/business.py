import os

from fastapi import APIRouter, Depends, HTTPException

from app.auth import get_current_user_id, require_business_owner
from app.models.schemas import Business, BusinessCreate, BusinessUpdate
from app.supabase_client import get_supabase

router = APIRouter(prefix="/api/business", tags=["business"])

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")


@router.post("", response_model=Business)
def create_business(
    payload: BusinessCreate, user_id: str = Depends(get_current_user_id)
) -> Business:
    supabase = get_supabase()
    result = (
        supabase.table("businesses")
        .insert({**payload.model_dump(), "owner_id": user_id})
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=500, detail="Could not create business")
    return Business(**result.data[0])


@router.get("/mine", response_model=Business)
def get_my_business(user_id: str = Depends(get_current_user_id)) -> Business:
    supabase = get_supabase()
    result = (
        supabase.table("businesses").select("*").eq("owner_id", user_id).limit(1).execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="No business found for this owner")
    return Business(**result.data[0])


@router.get("/{business_id}", response_model=Business)
def get_business(business_id: str) -> Business:
    supabase = get_supabase()
    result = supabase.table("businesses").select("*").eq("id", business_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Business not found")
    return Business(**result.data)


@router.patch("/{business_id}", response_model=Business)
def update_business(
    business_id: str, payload: BusinessUpdate, user_id: str = Depends(get_current_user_id)
) -> Business:
    supabase = get_supabase()
    require_business_owner(supabase, business_id, user_id)

    changes = payload.model_dump(exclude_unset=True)
    if not changes:
        raise HTTPException(status_code=400, detail="No changes provided")

    result = supabase.table("businesses").update(changes).eq("id", business_id).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Could not update business")
    return Business(**result.data[0])


@router.post("/{business_id}/pause", response_model=Business)
def pause_business(business_id: str, user_id: str = Depends(get_current_user_id)) -> Business:
    return _set_paused(business_id, user_id, True)


@router.post("/{business_id}/resume", response_model=Business)
def resume_business(business_id: str, user_id: str = Depends(get_current_user_id)) -> Business:
    return _set_paused(business_id, user_id, False)


def _set_paused(business_id: str, user_id: str, paused: bool) -> Business:
    supabase = get_supabase()
    require_business_owner(supabase, business_id, user_id)
    result = (
        supabase.table("businesses")
        .update({"is_paused": paused})
        .eq("id", business_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=500, detail="Could not update business")
    return Business(**result.data[0])


@router.get("/{business_id}/qr")
def get_business_qr(business_id: str) -> dict:
    """Returns the join URL the QR poster should encode; the image itself
    is rendered client-side so the poster can be styled and printed in-browser."""
    return {"business_id": business_id, "join_url": f"{FRONTEND_URL}/join/{business_id}"}
