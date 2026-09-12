from fastapi import APIRouter, Depends, HTTPException

from app.auth import get_current_user_id, require_business_owner
from app.models.schemas import Counter, CounterCreate, CounterUpdate
from app.services.catalog import load_counters, sync_active_counters_count
from app.supabase_client import get_supabase

router = APIRouter(prefix="/api/business", tags=["counters"])


@router.get("/{business_id}/counters", response_model=list[Counter])
def list_counters(business_id: str, user_id: str = Depends(get_current_user_id)) -> list[Counter]:
    supabase = get_supabase()
    require_business_owner(supabase, business_id, user_id)
    return [Counter(**row) for row in load_counters(supabase, business_id)]


@router.post("/{business_id}/counters", response_model=Counter)
def create_counter(
    business_id: str, payload: CounterCreate, user_id: str = Depends(get_current_user_id)
) -> Counter:
    supabase = get_supabase()
    require_business_owner(supabase, business_id, user_id)

    result = (
        supabase.table("counters")
        .insert({"business_id": business_id, "label": payload.label})
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=500, detail="Could not create counter")
    counter = result.data[0]

    _set_allowed_services(supabase, counter["id"], business_id, payload.allowed_service_ids)
    sync_active_counters_count(supabase, business_id)
    return Counter(**counter, allowed_service_ids=payload.allowed_service_ids)


@router.patch("/{business_id}/counters/{counter_id}", response_model=Counter)
def update_counter(
    business_id: str,
    counter_id: str,
    payload: CounterUpdate,
    user_id: str = Depends(get_current_user_id),
) -> Counter:
    supabase = get_supabase()
    require_business_owner(supabase, business_id, user_id)

    changes = payload.model_dump(exclude_unset=True, exclude={"allowed_service_ids"})
    if changes:
        result = (
            supabase.table("counters")
            .update(changes)
            .eq("id", counter_id)
            .eq("business_id", business_id)
            .execute()
        )
        if not result.data:
            raise HTTPException(status_code=404, detail="Counter not found")
    else:
        existing = (
            supabase.table("counters")
            .select("*")
            .eq("id", counter_id)
            .eq("business_id", business_id)
            .maybe_single()
            .execute()
        )
        if not existing or not existing.data:
            raise HTTPException(status_code=404, detail="Counter not found")

    if payload.allowed_service_ids is not None:
        _set_allowed_services(supabase, counter_id, business_id, payload.allowed_service_ids)

    sync_active_counters_count(supabase, business_id)

    counters = load_counters(supabase, business_id)
    updated = next((c for c in counters if c["id"] == counter_id), None)
    if not updated:
        raise HTTPException(status_code=404, detail="Counter not found")
    return Counter(**updated)


@router.delete("/{business_id}/counters/{counter_id}")
def delete_counter(
    business_id: str, counter_id: str, user_id: str = Depends(get_current_user_id)
) -> dict:
    supabase = get_supabase()
    require_business_owner(supabase, business_id, user_id)

    busy = (
        supabase.table("tokens")
        .select("id")
        .eq("counter_id", counter_id)
        .eq("status", "called")
        .limit(1)
        .execute()
    )
    if busy.data:
        raise HTTPException(
            status_code=409, detail="This counter is currently serving a customer"
        )

    result = (
        supabase.table("counters")
        .delete()
        .eq("id", counter_id)
        .eq("business_id", business_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Counter not found")

    sync_active_counters_count(supabase, business_id)
    return {"deleted": True}


def _set_allowed_services(
    supabase, counter_id: str, business_id: str, service_ids: list[str]
) -> None:
    supabase.table("counter_services").delete().eq("counter_id", counter_id).execute()
    if not service_ids:
        return

    owned = (
        supabase.table("services")
        .select("id")
        .eq("business_id", business_id)
        .in_("id", service_ids)
        .execute()
        .data
        or []
    )
    owned_ids = {row["id"] for row in owned}
    if owned_ids != set(service_ids):
        raise HTTPException(status_code=400, detail="Unknown service in allowed_service_ids")

    supabase.table("counter_services").insert(
        [{"counter_id": counter_id, "service_id": sid} for sid in service_ids]
    ).execute()
