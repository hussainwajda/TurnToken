from fastapi import APIRouter, Depends, HTTPException

from app.auth import get_current_user_id, require_business_owner
from app.models.schemas import Service, ServiceCreate, ServiceUpdate
from app.supabase_client import get_supabase

router = APIRouter(prefix="/api/business", tags=["services"])


@router.get("/{business_id}/services", response_model=list[Service])
def list_services(business_id: str, active_only: bool = True) -> list[Service]:
    """Public: the join-page service picker calls this with no session, so
    it only ever sees active services. The owner's management page passes
    active_only=false (no auth needed to *read* the archive either — the
    write endpoints below are what's actually gated)."""
    supabase = get_supabase()
    query = (
        supabase.table("services")
        .select("*")
        .eq("business_id", business_id)
        .order("sort_order")
        .order("created_at")
    )
    if active_only:
        query = query.eq("active", True)
    result = query.execute()
    return [Service(**row) for row in (result.data or [])]


@router.post("/{business_id}/services", response_model=Service)
def create_service(
    business_id: str, payload: ServiceCreate, user_id: str = Depends(get_current_user_id)
) -> Service:
    supabase = get_supabase()
    require_business_owner(supabase, business_id, user_id)

    last = (
        supabase.table("services")
        .select("sort_order")
        .eq("business_id", business_id)
        .order("sort_order", desc=True)
        .limit(1)
        .execute()
    )
    next_sort_order = (last.data[0]["sort_order"] + 1) if last.data else 0

    result = (
        supabase.table("services")
        .insert({**payload.model_dump(), "business_id": business_id, "sort_order": next_sort_order})
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=500, detail="Could not create service")
    return Service(**result.data[0])


@router.patch("/{business_id}/services/{service_id}", response_model=Service)
def update_service(
    business_id: str,
    service_id: str,
    payload: ServiceUpdate,
    user_id: str = Depends(get_current_user_id),
) -> Service:
    supabase = get_supabase()
    require_business_owner(supabase, business_id, user_id)

    changes = payload.model_dump(exclude_unset=True)
    if not changes:
        raise HTTPException(status_code=400, detail="No changes provided")

    result = (
        supabase.table("services")
        .update(changes)
        .eq("id", service_id)
        .eq("business_id", business_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Service not found")
    return Service(**result.data[0])


@router.delete("/{business_id}/services/{service_id}")
def delete_service(
    business_id: str, service_id: str, user_id: str = Depends(get_current_user_id)
) -> dict:
    """Hard-deletes a service with no booking history; a service that has
    ever been picked by a customer is archived instead (active=false) so
    the rolling-average and analytics history it's attributed to stays
    intact — this mirrors how counters/tokens already treat history as
    append-only."""
    supabase = get_supabase()
    require_business_owner(supabase, business_id, user_id)

    referenced = (
        supabase.table("token_services")
        .select("id")
        .eq("service_id", service_id)
        .limit(1)
        .execute()
    )
    if referenced.data:
        result = (
            supabase.table("services")
            .update({"active": False})
            .eq("id", service_id)
            .eq("business_id", business_id)
            .execute()
        )
        if not result.data:
            raise HTTPException(status_code=404, detail="Service not found")
        return {"archived": True}

    result = (
        supabase.table("services")
        .delete()
        .eq("id", service_id)
        .eq("business_id", business_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Service not found")
    return {"deleted": True}
