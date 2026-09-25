from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field, field_validator


class TokenStatus(str, Enum):
    waiting = "waiting"
    called = "called"
    serving = "serving"
    done = "done"
    skipped = "skipped"
    restored = "restored"
    expired = "expired"
    cancelled = "cancelled"


def _normalize_email(value: str) -> str:
    return value.strip().lower()


def _normalize_phone(value: str | None) -> str | None:
    """Strips formatting (spaces, dashes, parens) down to a canonical
    digits-with-leading-plus form so two owners can't dodge the duplicate
    check by typing the same number differently, e.g. "+91 98765 43210"
    and "+919876543210"."""
    if value is None:
        return None
    stripped = value.strip()
    if not stripped:
        return None
    plus = "+" if stripped.startswith("+") else ""
    digits = "".join(ch for ch in stripped if ch.isdigit())
    return f"{plus}{digits}" if digits else None


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

    @field_validator("name", "category")
    @classmethod
    def _strip_required(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("This field cannot be empty")
        return value

    @field_validator("contact_email")
    @classmethod
    def _clean_email(cls, value: str) -> str:
        value = _normalize_email(value)
        if not value or "@" not in value:
            raise ValueError("Enter a valid email address")
        return value

    @field_validator("contact_phone")
    @classmethod
    def _clean_phone(cls, value: str | None) -> str | None:
        return _normalize_phone(value)


class BusinessUpdate(BaseModel):
    name: str | None = None
    category: str | None = None
    contact_email: str | None = None
    contact_phone: str | None = None
    grace_timer_minutes: int | None = Field(default=None, ge=1, le=60)
    hold_window_minutes: int | None = Field(default=None, ge=1, le=120)
    default_service_time_minutes: int | None = Field(default=None, ge=1, le=180)
    almost_up_threshold: int | None = Field(default=None, ge=0, le=20)

    @field_validator("contact_email")
    @classmethod
    def _clean_email(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = _normalize_email(value)
        if not value or "@" not in value:
            raise ValueError("Enter a valid email address")
        return value

    @field_validator("contact_phone")
    @classmethod
    def _clean_phone(cls, value: str | None) -> str | None:
        return _normalize_phone(value)


class Business(BusinessCreate):
    id: str
    owner_id: str | None = None
    is_paused: bool = False
    created_at: datetime


class ServiceCreate(BaseModel):
    name: str
    estimated_minutes: int = Field(default=10, ge=1, le=240)

    @field_validator("name")
    @classmethod
    def _strip_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("This field cannot be empty")
        return value


class ServiceUpdate(BaseModel):
    name: str | None = None
    estimated_minutes: int | None = Field(default=None, ge=1, le=240)
    active: bool | None = None

    @field_validator("name")
    @classmethod
    def _strip_name(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        if not value:
            raise ValueError("This field cannot be empty")
        return value


class Service(ServiceCreate):
    id: str
    business_id: str
    active: bool = True
    sort_order: int = 0
    created_at: datetime


class CounterCreate(BaseModel):
    label: str
    allowed_service_ids: list[str] = Field(default_factory=list)

    @field_validator("label")
    @classmethod
    def _strip_label(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("This field cannot be empty")
        return value


class CounterUpdate(BaseModel):
    label: str | None = None
    active: bool | None = None
    allowed_service_ids: list[str] | None = None

    @field_validator("label")
    @classmethod
    def _strip_label(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        if not value:
            raise ValueError("This field cannot be empty")
        return value


class Counter(BaseModel):
    id: str
    business_id: str
    label: str
    active: bool = True
    allowed_service_ids: list[str] = Field(default_factory=list)


class TokenServiceSnapshot(BaseModel):
    service_id: str | None = None
    service_name: str
    estimated_minutes: int


class TokenCreate(BaseModel):
    service_ids: list[str] = Field(default_factory=list)


class Token(BaseModel):
    id: str
    business_id: str
    position: int
    status: TokenStatus
    counter_id: str | None = None
    services: list[TokenServiceSnapshot] = Field(default_factory=list)
    created_at: datetime
    called_at: datetime | None = None
    served_at: datetime | None = None
    skipped_at: datetime | None = None
    restored_at: datetime | None = None
    expired_at: datetime | None = None
    estimated_wait_minutes: float | None = None


class TokenStatusResponse(BaseModel):
    token: Token
    position_in_queue: int
    tokens_ahead: int
    estimated_wait_minutes: float
    counter_label: str | None = None


class CounterState(BaseModel):
    id: str
    label: str
    active: bool
    allowed_service_ids: list[str] = Field(default_factory=list)
    current_token: Token | None = None


class QueueResponse(BaseModel):
    business_id: str
    counters: list[CounterState]
    waiting: list[Token]
    skipped: list[Token]


class PushSubscriptionCreate(BaseModel):
    endpoint: str
    p256dh: str
    auth: str


class ServiceBreakdown(BaseModel):
    service_name: str
    count: int
    average_minutes: float


class AnalyticsResponse(BaseModel):
    business_id: str
    date: str
    customers_served: int
    average_wait_minutes: float
    peak_hour: int | None
    no_show_count: int
    no_show_rate: float
    waiting_now: int
    top_services: list[ServiceBreakdown] = Field(default_factory=list)


class AdminOverviewResponse(BaseModel):
    total_businesses: int
    active_businesses: int
    paused_businesses: int
    total_tokens_today: int
    waiting_now: int
    called_now: int
    serving_now: int
    done_today: int
    skipped_today: int
    expired_today: int
    no_show_rate_today: float
    average_wait_minutes_today: float
    category_counts: dict[str, int]


class AdminBusinessItem(Business):
    waiting_count: int = 0
    called_position: int | None = None
    total_tokens_today: int = 0
    done_today: int = 0
    expired_today: int = 0


class AdminActivityItem(BaseModel):
    token_id: str
    business_id: str
    business_name: str
    position: int
    status: TokenStatus
    created_at: datetime
    called_at: datetime | None = None
    served_at: datetime | None = None
    skipped_at: datetime | None = None
    expired_at: datetime | None = None


class AdminVerifyRequest(BaseModel):
    passcode: str | None = None


class AdminVerifyResponse(BaseModel):
    valid: bool
    auth_method: str
    email: str | None = None
