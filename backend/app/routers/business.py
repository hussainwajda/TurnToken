from fastapi import APIRouter, Depends, HTTPException

from app.auth import get_current_user_id, require_business_owner
from app.config import get_settings
from app.models.schemas import Business, BusinessCreate, BusinessUpdate
from app.services.realtime import notify_business
from app.supabase_client import get_supabase

router = APIRouter(prefix="/api/business", tags=["business"])


@router.post("", response_model=Business)
def create_business(
    payload: BusinessCreate, user_id: str = Depends(get_current_user_id)
) -> Business:
    supabase = get_supabase()

    existing_for_owner = (
        supabase.table("businesses")
        .select("id")
        .eq("owner_id", user_id)
        .limit(1)
        .execute()
    )
    if existing_for_owner.data:
        raise HTTPException(
            status_code=409,
            detail="This account already has a business registered to it.",
        )

    existing_email = (
        supabase.table("businesses")
        .select("id")
        .eq("contact_email", payload.contact_email)
        .limit(1)
        .execute()
    )
    if existing_email.data:
        raise HTTPException(
            status_code=409,
            detail="A business is already registered with this email.",
        )

    if payload.contact_phone:
        existing_phone = (
            supabase.table("businesses")
            .select("id")
            .eq("contact_phone", payload.contact_phone)
            .limit(1)
            .execute()
        )
        if existing_phone.data:
            raise HTTPException(
                status_code=409,
                detail="A business is already registered with this phone number.",
            )

    result = (
        supabase.table("businesses")
        .insert({**payload.model_dump(), "owner_id": user_id})
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=500, detail="Could not create business")
    business = result.data[0]

    # Seed one counter per the "how many counters" figure given at signup,
    # so the owner lands on a dashboard that's already usable instead of
    # an empty Counters page — they can rename or add more afterwards.
    supabase.table("counters").insert(
        [
            {"business_id": business["id"], "label": f"Counter {i + 1}"}
            for i in range(payload.active_counters)
        ]
    ).execute()

    return Business(**business)


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
    result = (
        supabase.table("businesses").select("*").eq("id", business_id).maybe_single().execute()
    )
    if not result or not result.data:
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

    if changes.get("contact_email"):
        clash = (
            supabase.table("businesses")
            .select("id")
            .eq("contact_email", changes["contact_email"])
            .neq("id", business_id)
            .limit(1)
            .execute()
        )
        if clash.data:
            raise HTTPException(
                status_code=409,
                detail="A business is already registered with this email.",
            )

    if changes.get("contact_phone"):
        clash = (
            supabase.table("businesses")
            .select("id")
            .eq("contact_phone", changes["contact_phone"])
            .neq("id", business_id)
            .limit(1)
            .execute()
        )
        if clash.data:
            raise HTTPException(
                status_code=409,
                detail="A business is already registered with this phone number.",
            )

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
    notify_business(business_id, "business_updated")
    return Business(**result.data[0])


@router.get("/{business_id}/qr")
def get_business_qr(business_id: str) -> dict:
    """Returns the join URL the QR poster should encode; the image itself
    is rendered client-side so the poster can be styled and printed in-browser."""
    return {
        "business_id": business_id,
        "join_url": f"{get_settings().frontend_url}/join/{business_id}",
    }
