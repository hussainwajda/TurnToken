from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from app.services.ratelimit import RateLimiter


def _request(ip: str = "1.2.3.4"):
    return SimpleNamespace(client=SimpleNamespace(host=ip))


def test_allows_requests_under_the_limit():
    limiter = RateLimiter(max_requests=3, per_seconds=60)
    for _ in range(3):
        limiter(_request())  # should not raise


def test_blocks_the_request_that_exceeds_the_limit():
    limiter = RateLimiter(max_requests=2, per_seconds=60)
    limiter(_request())
    limiter(_request())
    with pytest.raises(HTTPException) as exc_info:
        limiter(_request())
    assert exc_info.value.status_code == 429


def test_limits_are_tracked_independently_per_ip():
    limiter = RateLimiter(max_requests=1, per_seconds=60)
    limiter(_request("1.1.1.1"))
    limiter(_request("2.2.2.2"))  # different IP, should not raise


def test_old_hits_outside_the_window_are_forgotten(monkeypatch):
    limiter = RateLimiter(max_requests=1, per_seconds=60)
    clock = {"now": 1000.0}
    monkeypatch.setattr("app.services.ratelimit.time.monotonic", lambda: clock["now"])

    limiter(_request())
    with pytest.raises(HTTPException):
        limiter(_request())

    clock["now"] += 61
    limiter(_request())  # window has rolled past the first hit
