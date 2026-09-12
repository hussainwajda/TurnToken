"""A small in-process token-bucket rate limiter for the unauthenticated
endpoints (issuing a token, subscribing to push, cancelling a token) —
without it, anyone can script a flood of joins into a shop's queue.

In-process, keyed by client IP: adequate for a single-instance MVP
deployment (matches the sweep's existing single-process assumption in
app/config.py's RUN_STATE_MACHINE). Swap for a shared store such as Redis
if the backend ever runs more than one process.
"""

import time
from collections import defaultdict

from fastapi import HTTPException, Request


class RateLimiter:
    def __init__(self, max_requests: int, per_seconds: float) -> None:
        self.max_requests = max_requests
        self.per_seconds = per_seconds
        self._hits: dict[str, list[float]] = defaultdict(list)

    def __call__(self, request: Request) -> None:
        client_ip = request.client.host if request.client else "unknown"
        now = time.monotonic()
        window_start = now - self.per_seconds

        hits = self._hits[client_ip]
        while hits and hits[0] < window_start:
            hits.pop(0)

        if len(hits) >= self.max_requests:
            raise HTTPException(
                status_code=429,
                detail="Too many requests — please slow down and try again shortly.",
            )
        hits.append(now)


# Generous limits: customers legitimately share hotspots/NAT'd wifi, so
# these guard against scripted abuse, not normal shop-counter traffic.
issue_token_limiter = RateLimiter(max_requests=10, per_seconds=60)
push_subscribe_limiter = RateLimiter(max_requests=10, per_seconds=60)
cancel_token_limiter = RateLimiter(max_requests=20, per_seconds=60)
