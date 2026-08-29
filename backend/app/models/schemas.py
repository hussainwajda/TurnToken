from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class TokenStatus(str, Enum):
    waiting = "waiting"
    called = "called"
    serving = "serving"
    done = "done"
    skipped = "skipped"
    restored = "restored"
    expired = "expired"
    cancelled = "cancelled"


class BusinessCreate(BaseModel):
    name: str
    category: str
    contact_email: str
    contact_phone: str | None = None
    grace_timer_minutes: int = Field(default=5, ge=1, le=60)
    hold_window_minutes: int = Field(default=15, ge=1, le=120)
    active_counters: int = Field(default=1, ge=1, le=20)
    default_service_time_minutes: int = Field(default=10, ge=1, le=180)
    almost_up_threshold: int = Field(default=2, ge=0, le=20)


class BusinessUpdate(BaseModel):
    name: str | None = None
    category: str | None = None
    contact_email: str | None = None
    contact_phone: str | None = None
    grace_timer_minutes: int | None = Field(default=None, ge=1, le=60)
    hold_window_minutes: int | None = Field(default=None, ge=1, le=120)
    active_counters: int | None = Field(default=None, ge=1, le=20)
    default_service_time_minutes: int | None = Field(default=None, ge=1, le=180)
    almost_up_threshold: int | None = Field(default=None, ge=0, le=20)


class Business(BusinessCreate):
    id: str
    owner_id: str | None = None
    is_paused: bool = False
    created_at: datetime


class Token(BaseModel):
    id: str
    business_id: str
    position: int
    status: TokenStatus
    created_at: datetime
    called_at: datetime | None = None
    served_at: datetime | None = None
    skipped_at: datetime | None = None
    restored_at: datetime | None = None
    expired_at: datetime | None = None


class TokenStatusResponse(BaseModel):
    token: Token
    position_in_queue: int
    tokens_ahead: int
    estimated_wait_minutes: float


class QueueResponse(BaseModel):
    business_id: str
    tokens: list[Token]
    currently_serving: Token | None = None


class PushSubscriptionCreate(BaseModel):
    endpoint: str
    p256dh: str
    auth: str


class AnalyticsResponse(BaseModel):
    business_id: str
    date: str
    customers_served: int
    average_wait_minutes: float
    peak_hour: int | None
    no_show_count: int
    no_show_rate: float
    waiting_now: int
