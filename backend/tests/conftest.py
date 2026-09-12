import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import pytest

from tests.fake_supabase import FakeSupabaseClient


@pytest.fixture
def fake_client() -> FakeSupabaseClient:
    return FakeSupabaseClient()


@pytest.fixture(autouse=True)
def _reset_rate_limiters():
    """The rate limiters in app/services/ratelimit.py are module-level
    singletons keyed by client IP, and every TestClient request looks like
    the same IP — without this, tests would trip each other's 429s."""
    from app.services import ratelimit

    for limiter in (
        ratelimit.issue_token_limiter,
        ratelimit.push_subscribe_limiter,
        ratelimit.cancel_token_limiter,
    ):
        limiter._hits.clear()
    yield


def minutes_ago(n: float) -> str:
    return (datetime.now(timezone.utc) - timedelta(minutes=n)).isoformat()


def minutes_from_now(n: float) -> str:
    return (datetime.now(timezone.utc) + timedelta(minutes=n)).isoformat()
