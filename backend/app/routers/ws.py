"""Real-time layer per PRD section 11: a WebSocket channel, scoped per
business, separate from the REST endpoints. Both sockets below just tell
a connected client "something changed" — the client re-fetches its own
existing REST view, so this file owns none of the queue/ETA logic."""

import asyncio
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from starlette.websockets import WebSocketState

from app.auth import InvalidTokenError, require_business_owner, verify_access_token
from app.services.realtime import hub
from app.supabase_client import get_supabase

router = APIRouter(tags=["realtime"])
logger = logging.getLogger("turn_token.ws")

AUTH_TIMEOUT_SECONDS = 5


@router.websocket("/ws/business/{business_id}")
async def business_socket(websocket: WebSocket, business_id: str) -> None:
    await websocket.accept()

    try:
        auth_message = await asyncio.wait_for(
            websocket.receive_json(), timeout=AUTH_TIMEOUT_SECONDS
        )
        access_token = (
            auth_message.get("access_token") if isinstance(auth_message, dict) else None
        )
        if not access_token:
            raise ValueError("Missing access_token")

        supabase = get_supabase()
        user_id = await asyncio.to_thread(verify_access_token, access_token)
        await asyncio.to_thread(require_business_owner, supabase, business_id, user_id)
    except (TimeoutError, ValueError, InvalidTokenError):
        await _reject(websocket)
        return
    except Exception:
        # require_business_owner raises HTTPException for a missing or
        # not-owned business — either way, this socket doesn't get in.
        await _reject(websocket)
        return

    await hub.join(business_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        await hub.leave(business_id, websocket)


@router.websocket("/ws/token/{token_id}")
async def token_socket(websocket: WebSocket, token_id: str) -> None:
    """Public, like the REST status endpoint it mirrors — the unguessable
    token UUID is the capability. A token's own position only changes
    because of *other* tokens moving, so this just resolves to the same
    business room the dashboard listens on."""
    await websocket.accept()

    try:
        token_row = await asyncio.to_thread(_lookup_token_business, token_id)
    except Exception:
        token_row = None
    if not token_row:
        await _reject(websocket)
        return

    business_id = token_row["business_id"]
    await hub.join(business_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        await hub.leave(business_id, websocket)


def _lookup_token_business(token_id: str) -> dict | None:
    result = (
        get_supabase()
        .table("tokens")
        .select("business_id")
        .eq("id", token_id)
        .maybe_single()
        .execute()
    )
    return result.data if result else None


async def _reject(websocket: WebSocket) -> None:
    if websocket.application_state == WebSocketState.CONNECTED:
        await websocket.close(code=1008)
