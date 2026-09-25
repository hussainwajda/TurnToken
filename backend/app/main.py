import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import admin, analytics, business, counters, push, queue, services, token, ws
from app.services.realtime import hub
from app.services.state_machine import sweep_expirations
from app.supabase_client import get_supabase

settings = get_settings()
settings.require_configured()
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

app.include_router(business.router)
app.include_router(services.router)
app.include_router(counters.router)
app.include_router(token.router)
app.include_router(queue.router)
app.include_router(analytics.router)
app.include_router(push.router)
app.include_router(ws.router)
app.include_router(admin.router)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
