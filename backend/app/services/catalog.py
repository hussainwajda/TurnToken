"""Shared hydration helpers for services, counters, and token service
snapshots — pulled out of the routers since queue, token, and counters all
need the same "attach related rows" logic."""

from supabase import Client


def sync_active_counters_count(supabase: Client, business_id: str) -> None:
    """The business's active_counters column is a server-maintained count
    of its active counter rows, kept for cold-start ETA math and for
    display — it is no longer directly editable via BusinessUpdate now that
    counters are managed as real rows."""
    count = (
        supabase.table("counters")
        .select("id", count="exact")
        .eq("business_id", business_id)
        .eq("active", True)
        .execute()
        .count
        or 0
    )
    supabase.table("businesses").update({"active_counters": max(count, 1)}).eq(
        "id", business_id
    ).execute()


def load_counters(supabase: Client, business_id: str) -> list[dict]:
    counters = (
        supabase.table("counters")
        .select("*")
        .eq("business_id", business_id)
        .order("label")
        .execute()
        .data
        or []
    )
    if not counters:
        return []

    links = (
        supabase.table("counter_services")
        .select("counter_id,service_id")
        .in_("counter_id", [c["id"] for c in counters])
        .execute()
        .data
        or []
    )
    allowed_by_counter: dict[str, list[str]] = {}
    for link in links:
        allowed_by_counter.setdefault(link["counter_id"], []).append(link["service_id"])

    for counter in counters:
        counter["allowed_service_ids"] = allowed_by_counter.get(counter["id"], [])
    return counters


def load_token_services(supabase: Client, token_ids: list[str]) -> dict[str, list[dict]]:
    if not token_ids:
        return {}
    rows = (
        supabase.table("token_services")
        .select("token_id,service_id,service_name,estimated_minutes")
        .in_("token_id", token_ids)
        .execute()
        .data
        or []
    )
    by_token: dict[str, list[dict]] = {}
    for row in rows:
        by_token.setdefault(row["token_id"], []).append(row)
    return by_token


def hydrate_token(token_row: dict, services_by_token: dict[str, list[dict]]) -> dict:
    return {**token_row, "services": services_by_token.get(token_row["id"], [])}
