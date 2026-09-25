from collections import Counter
from datetime import datetime, time, timezone
from fastapi import APIRouter, Depends, Header, HTTPException, Query

from app.config import get_settings
from app.models.schemas import (
    AdminActivityItem,
    AdminBusinessItem,
    AdminOverviewResponse,
    AdminVerifyRequest,
    AdminVerifyResponse,
    Business,
    BusinessUpdate,
    QueueResponse,
    Token,
)
from app.supabase_client import get_supabase

router = APIRouter(prefix="/api/admin", tags=["super-admin"])


def _start_of_today() -> datetime:
    now = datetime.now(timezone.utc)
    return datetime.combine(now.date(), time.min, tzinfo=timezone.utc)


def require_super_admin(
    x_admin_passcode: str | None = Header(default=None),
    authorization: str | None = Header(default=None),
) -> dict:
    """Authenticates a super-admin using either:
    1. Direct admin passcode header (X-Admin-Passcode)
    2. Supabase access token (Authorization: Bearer <token>) whose user email
       matches settings.super_admin_emails or has is_super_admin metadata.
    """
    settings = get_settings()

    # 1. Check Passcode
    if x_admin_passcode and settings.super_admin_passcode:
        if x_admin_passcode.strip() == settings.super_admin_passcode.strip():
            return {"method": "passcode", "identifier": "passcode-operator"}

    # 2. Check Supabase User Email / Metadata
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1]
        supabase = get_supabase()
        try:
            result = supabase.auth.get_user(token)
            if result and result.user:
                user = result.user
                email = (user.email or "").lower()
                allowed_emails = [e.lower() for e in settings.super_admin_emails]

                is_email_allowed = email in allowed_emails if allowed_emails else False
                app_meta = getattr(user, "app_metadata", {}) or {}
                user_meta = getattr(user, "user_metadata", {}) or {}
                has_admin_flag = (
                    app_meta.get("role") == "super_admin"
                    or user_meta.get("is_super_admin") is True
                )

                if is_email_allowed or has_admin_flag:
                    return {"method": "email", "identifier": user.email}
        except Exception:
            pass

    raise HTTPException(status_code=403, detail="Super admin authorization required")


@router.post("/verify", response_model=AdminVerifyResponse)
def verify_admin(
    payload: AdminVerifyRequest | None = None,
    x_admin_passcode: str | None = Header(default=None),
    authorization: str | None = Header(default=None),
) -> AdminVerifyResponse:
    """Verifies super admin credentials without performing other operations."""
    settings = get_settings()

    # Test passcode from body or header
    passcode = (payload.passcode if payload and payload.passcode else x_admin_passcode) or ""
    if passcode and settings.super_admin_passcode:
        if passcode.strip() == settings.super_admin_passcode.strip():
            return AdminVerifyResponse(
                valid=True, auth_method="passcode", email=None
            )

    # Test bearer token
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1]
        supabase = get_supabase()
        try:
            result = supabase.auth.get_user(token)
            if result and result.user:
                email = (result.user.email or "").lower()
                allowed_emails = [e.lower() for e in settings.super_admin_emails]
                is_email_allowed = email in allowed_emails if allowed_emails else False
                app_meta = getattr(result.user, "app_metadata", {}) or {}
                user_meta = getattr(result.user, "user_metadata", {}) or {}
                has_admin_flag = (
                    app_meta.get("role") == "super_admin"
                    or user_meta.get("is_super_admin") is True
                )
                if is_email_allowed or has_admin_flag:
                    return AdminVerifyResponse(
                        valid=True, auth_method="email", email=result.user.email
                    )
        except Exception:
            pass

    raise HTTPException(status_code=401, detail="Invalid admin credentials")


@router.get("/overview", response_model=AdminOverviewResponse)
def get_admin_overview(_admin: dict = Depends(require_super_admin)) -> AdminOverviewResponse:
    supabase = get_supabase()
    start_of_day = _start_of_today()

    # 1. Fetch all businesses
    businesses_res = supabase.table("businesses").select("*").execute()
    businesses = businesses_res.data or []

    # 2. Fetch today's tokens
    today_tokens_res = (
        supabase.table("tokens")
        .select("id,business_id,position,status,created_at,called_at,served_at,skipped_at,expired_at")
        .gte("created_at", start_of_day.isoformat())
        .execute()
    )
    today_tokens = today_tokens_res.data or []

    # 3. Fetch currently active tokens across all businesses
    active_tokens_res = (
        supabase.table("tokens")
        .select("id,business_id,position,status")
        .in_("status", ["waiting", "called", "serving", "skipped", "restored"])
        .execute()
    )
    active_tokens = active_tokens_res.data or []

    # Aggregate metrics
    total_businesses = len(businesses)
    active_businesses = sum(1 for b in businesses if not b.get("is_paused"))
    paused_businesses = sum(1 for b in businesses if b.get("is_paused"))

    waiting_now = sum(1 for t in active_tokens if t["status"] in ("waiting", "restored"))
    called_now = sum(1 for t in active_tokens if t["status"] == "called")
    serving_now = sum(1 for t in active_tokens if t["status"] == "serving")

    total_tokens_today = len(today_tokens)
    done_today = sum(1 for t in today_tokens if t["status"] == "done")
    skipped_today = sum(1 for t in today_tokens if t["status"] == "skipped")
    expired_today = sum(1 for t in today_tokens if t["status"] == "expired")
    no_show_rate_today = (
        round(expired_today / total_tokens_today, 3) if total_tokens_today else 0.0
    )

    served_today_tokens = [
        t for t in today_tokens if t["status"] == "done" and t.get("served_at") and t.get("created_at")
    ]
    wait_minutes = [
        (datetime.fromisoformat(t["served_at"]) - datetime.fromisoformat(t["created_at"])).total_seconds() / 60
        for t in served_today_tokens
    ]
    avg_wait = round(sum(wait_minutes) / len(wait_minutes), 1) if wait_minutes else 0.0

    category_counts = dict(Counter(b.get("category", "Other") for b in businesses))

    return AdminOverviewResponse(
        total_businesses=total_businesses,
        active_businesses=active_businesses,
        paused_businesses=paused_businesses,
        total_tokens_today=total_tokens_today,
        waiting_now=waiting_now,
        called_now=called_now,
        serving_now=serving_now,
        done_today=done_today,
        skipped_today=skipped_today,
        expired_today=expired_today,
        no_show_rate_today=no_show_rate_today,
        average_wait_minutes_today=avg_wait,
        category_counts=category_counts,
    )


@router.get("/businesses", response_model=list[AdminBusinessItem])
def get_admin_businesses(_admin: dict = Depends(require_super_admin)) -> list[AdminBusinessItem]:
    supabase = get_supabase()
    start_of_day = _start_of_today()

    businesses_res = (
        supabase.table("businesses").select("*").order("created_at", desc=True).execute()
    )
    businesses = businesses_res.data or []

    # Active tokens map: business_id -> tokens
    active_tokens_res = (
        supabase.table("tokens")
        .select("business_id,position,status")
        .in_("status", ["waiting", "called", "serving", "restored"])
        .execute()
    )
    active_tokens = active_tokens_res.data or []

    # Today tokens count map: business_id -> { total, done, expired }
    today_tokens_res = (
        supabase.table("tokens")
        .select("business_id,status")
        .gte("created_at", start_of_day.isoformat())
        .execute()
    )
    today_tokens = today_tokens_res.data or []

    waiting_map: dict[str, int] = Counter()
    called_map: dict[str, int] = {}
    for t in active_tokens:
        bid = t["business_id"]
        status = t["status"]
        if status in ("waiting", "restored"):
            waiting_map[bid] += 1
        elif status in ("called", "serving") and bid not in called_map:
            called_map[bid] = t["position"]

    today_total_map: dict[str, int] = Counter()
    today_done_map: dict[str, int] = Counter()
    today_expired_map: dict[str, int] = Counter()

    for t in today_tokens:
        bid = t["business_id"]
        today_total_map[bid] += 1
        if t["status"] == "done":
            today_done_map[bid] += 1
        elif t["status"] == "expired":
            today_expired_map[bid] += 1

    result = []
    for b in businesses:
        bid = b["id"]
        result.append(
            AdminBusinessItem(
                **b,
                waiting_count=waiting_map.get(bid, 0),
                called_position=called_map.get(bid),
                total_tokens_today=today_total_map.get(bid, 0),
                done_today=today_done_map.get(bid, 0),
                expired_today=today_expired_map.get(bid, 0),
            )
        )

    return result


@router.get("/businesses/{business_id}/queue", response_model=QueueResponse)
def get_admin_business_queue(
    business_id: str, _admin: dict = Depends(require_super_admin)
) -> QueueResponse:
    supabase = get_supabase()
    tokens_res = (
        supabase.table("tokens")
        .select("*")
        .eq("business_id", business_id)
        .in_("status", ["waiting", "called", "serving", "skipped", "restored"])
        .order("position")
        .execute()
    )
    tokens = [Token(**row) for row in (tokens_res.data or [])]
    currently_serving = next((t for t in tokens if t.status in ("called", "serving")), None)
    return QueueResponse(
        business_id=business_id,
        tokens=tokens,
        currently_serving=currently_serving,
    )


@router.patch("/businesses/{business_id}", response_model=Business)
def update_admin_business(
    business_id: str,
    payload: BusinessUpdate,
    _admin: dict = Depends(require_super_admin),
) -> Business:
    supabase = get_supabase()
    changes = payload.model_dump(exclude_unset=True)
    if not changes:
        raise HTTPException(status_code=400, detail="No changes provided")

    result = supabase.table("businesses").update(changes).eq("id", business_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Business not found")
    return Business(**result.data[0])


@router.post("/businesses/{business_id}/toggle-pause", response_model=Business)
def toggle_admin_business_pause(
    business_id: str, _admin: dict = Depends(require_super_admin)
) -> Business:
    supabase = get_supabase()
    business = (
        supabase.table("businesses").select("is_paused").eq("id", business_id).single().execute()
    )
    if not business.data:
        raise HTTPException(status_code=404, detail="Business not found")

    new_paused = not business.data.get("is_paused", False)
    result = (
        supabase.table("businesses")
        .update({"is_paused": new_paused})
        .eq("id", business_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=500, detail="Could not toggle pause")
    return Business(**result.data[0])


@router.get("/activity", response_model=list[AdminActivityItem])
def get_admin_activity(
    limit: int = Query(default=50, ge=1, le=200),
    _admin: dict = Depends(require_super_admin),
) -> list[AdminActivityItem]:
    supabase = get_supabase()

    tokens_res = (
        supabase.table("tokens")
        .select("id,business_id,position,status,created_at,called_at,served_at,skipped_at,expired_at")
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    tokens = tokens_res.data or []
    if not tokens:
        return []

    # Fetch business names for tokens
    bids = list({t["business_id"] for t in tokens})
    businesses_res = (
        supabase.table("businesses").select("id,name").in_("id", bids).execute()
    )
    name_map = {b["id"]: b["name"] for b in (businesses_res.data or [])}

    activity = []
    for t in tokens:
        activity.append(
            AdminActivityItem(
                token_id=t["id"],
                business_id=t["business_id"],
                business_name=name_map.get(t["business_id"], "Unknown business"),
                position=t["position"],
                status=t["status"],
                created_at=t["created_at"],
                called_at=t.get("called_at"),
                served_at=t.get("served_at"),
                skipped_at=t.get("skipped_at"),
                expired_at=t.get("expired_at"),
            )
        )
    return activity


@router.post("/businesses/{business_id}/queue/reset")
def reset_admin_business_queue(
    business_id: str, _admin: dict = Depends(require_super_admin)
) -> dict:
    """Super Admin emergency action: Cancels all active tokens for a business."""
    supabase = get_supabase()
    res = (
        supabase.table("tokens")
        .update({"status": "cancelled"})
        .eq("business_id", business_id)
        .in_("status", ["waiting", "called", "serving", "skipped", "restored"])
        .execute()
    )
    count = len(res.data or [])
    return {"business_id": business_id, "cancelled_count": count}
