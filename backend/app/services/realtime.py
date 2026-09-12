"""In-process pub/sub for the owner dashboard and customer status page.

One room per business. Route handlers publish a lightweight invalidation
event ("something changed") rather than serialized state — every client
already knows how to re-fetch its own REST view, so this avoids a second
place where auth, ordering, and derived fields like ETA would need to be
kept in sync with the REST responses.

This hub is a single Python process's in-memory state, which matches the
background sweep's existing single-instance assumption (see
RUN_STATE_MACHINE in app/config.py). If the backend ever runs more than
one process, this needs to become a shared pub/sub (e.g. Redis) so a
socket connected to worker A hears about a change made on worker B.
"""

import asyncio
import logging

from fastapi import WebSocket

logger = logging.getLogger("turn_token.realtime")


class ConnectionHub:
    def __init__(self) -> None:
        self._rooms: dict[str, set[WebSocket]] = {}
        self._lock = asyncio.Lock()
        self._loop: asyncio.AbstractEventLoop | None = None

    def bind_loop(self, loop: asyncio.AbstractEventLoop) -> None:
        """Called once from the app's lifespan startup. Route handlers run
        sync code in a threadpool and the sweep runs in its own thread
        (see main.py), so both need a reference back to this loop to hand
        off a publish safely via run_coroutine_threadsafe."""
        self._loop = loop

    async def join(self, business_id: str, websocket: WebSocket) -> None:
        async with self._lock:
            self._rooms.setdefault(business_id, set()).add(websocket)

    async def leave(self, business_id: str, websocket: WebSocket) -> None:
        async with self._lock:
            room = self._rooms.get(business_id)
            if not room:
                return
            room.discard(websocket)
            if not room:
                self._rooms.pop(business_id, None)

    async def publish(self, business_id: str, event: dict) -> None:
        async with self._lock:
            sockets = list(self._rooms.get(business_id, ()))
        for websocket in sockets:
            try:
                await websocket.send_json(event)
            except Exception:
                logger.debug("dropping dead socket in room %s", business_id)
                await self.leave(business_id, websocket)

    def notify(self, business_id: str, event: dict) -> None:
        """Sync-safe entry point: safe to call from a sync route handler
        (FastAPI runs those in a threadpool) or the sweep's worker thread."""
        if self._loop is None:
            return
        try:
            asyncio.run_coroutine_threadsafe(self.publish(business_id, event), self._loop)
        except RuntimeError:
            logger.debug("event loop unavailable, dropping realtime event")


hub = ConnectionHub()


def notify_business(business_id: str, event_type: str, **extra: object) -> None:
    hub.notify(business_id, {"type": event_type, **extra})
