import threading
from typing import Optional

import httpx
from supabase import Client, create_client
from supabase.client import ClientOptions

from app.config import get_settings

_thread_local = threading.local()


def get_supabase() -> Client:
    """Returns a thread-safe Supabase client.

    Uses thread-local storage so each worker thread in FastAPI's AnyIO threadpool
    and background sweeps maintains its own isolated HTTP transport and connection
    pool. This eliminates cross-thread socket contention on macOS/Darwin that causes
    `httpx.ReadError: [Errno 35] Resource temporarily unavailable`.
    """
    client: Optional[Client] = getattr(_thread_local, "client", None)
    if client is None:
        settings = get_settings()
        key = settings.supabase_service_role_key or settings.supabase_anon_key
        transport = httpx.HTTPTransport(retries=3)
        httpx_client = httpx.Client(transport=transport, timeout=30.0)
        options = ClientOptions(httpx_client=httpx_client)
        client = create_client(settings.supabase_url, key, options)
        _thread_local.client = client
    return client

