import asyncio
import logging
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.routers import analytics, business, counters, push, queue, services, token, ws
from app.services.realtime import hub
from app.services.state_machine import sweep_expirations
from app.supabase_client import get_supabase

settings = get_settings()
settings.require_configured()

# Without this, app-level `logger.info(...)` calls (e.g. the push delivery
# trail in app/services/push.py) are silently dropped: nothing in this
# codebase calls basicConfig, so the root logger has no handler and only
# WARNING+ records reach the terminal via Python's last-resort handler.
#
# Root stays at WARNING — only the "turn_token" namespace is bumped to INFO
# — so this doesn't also switch on httpx's per-request INFO logging (every
# Supabase REST call) and bury the one line you're actually looking for.
logging.basicConfig(level=logging.WARNING, format="%(levelname)s %(name)s: %(message)s")
logging.getLogger("turn_token").setLevel(logging.INFO)
logger = logging.getLogger("turn_token")

SWEEP_INTERVAL_SECONDS = 15


async def _sweep_loop() -> None:
    while True:
        try:
            if settings.run_state_machine:
                # sweep_expirations makes blocking Supabase HTTP calls;
                # run it off the event loop so it can't stall every
                # request (and every open WebSocket) while it runs.
                await asyncio.to_thread(sweep_expirations, get_supabase())
        except Exception:
            logger.exception("state machine sweep failed")
        await asyncio.sleep(SWEEP_INTERVAL_SECONDS)


@asynccontextmanager
async def lifespan(app: FastAPI):
    hub.bind_loop(asyncio.get_running_loop())
    task = asyncio.create_task(_sweep_loop())
    try:
        yield
    finally:
        task.cancel()


app = FastAPI(title="Turn-Token API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(httpx.TransportError)
async def httpx_transport_exception_handler(request, exc: httpx.TransportError):
    logger.warning("Supabase connection error on %s: %s", request.url.path, exc)
    return JSONResponse(
        status_code=503,
        content={"detail": "Database connection temporarily unavailable. Please retry."},
    )

app.include_router(business.router)
app.include_router(services.router)
app.include_router(counters.router)
app.include_router(token.router)
app.include_router(queue.router)
app.include_router(analytics.router)
app.include_router(push.router)
app.include_router(ws.router)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
