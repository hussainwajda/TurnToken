from fastapi import Header, HTTPException

from app.supabase_client import get_supabase


class InvalidTokenError(Exception):
    """Raised by verify_access_token; kept separate from HTTPException so
    the WebSocket handshake (which can't return an HTTP response) can
    catch it without pulling in REST-specific error shapes."""


def verify_access_token(token: str) -> str:
    """Verifies a Supabase access token and returns the user id it belongs
    to. Shared by the REST bearer-token dependency below and the
    WebSocket auth handshake in app/routers/ws.py."""
    supabase = get_supabase()
    try:
        result = supabase.auth.get_user(token)
    except Exception as exc:
        raise InvalidTokenError("Invalid session") from exc

    if not result or not result.user:
        raise InvalidTokenError("Invalid session")

    return result.user.id


def get_current_user_id(authorization: str | None = Header(default=None)) -> str:
    """Verifies the Supabase access token sent by the frontend and returns
    the owner's user id. Queue-control endpoints depend on this per the
    PRD's NFR: "Owner authentication required for all queue control actions"."""
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")

    token = authorization.split(" ", 1)[1]
    try:
        return verify_access_token(token)
    except InvalidTokenError as exc:
        raise HTTPException(status_code=401, detail="Invalid session") from exc


def require_business_owner(supabase, business_id: str, user_id: str) -> None:
    business = (
        supabase.table("businesses")
        .select("owner_id")
        .eq("id", business_id)
        .maybe_single()
        .execute()
    )
    if not business or not business.data:
        raise HTTPException(status_code=404, detail="Business not found")
    if business.data.get("owner_id") != user_id:
        raise HTTPException(status_code=403, detail="Not this business's owner")
