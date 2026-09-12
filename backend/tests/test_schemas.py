import pytest
from pydantic import ValidationError

from app.models.schemas import BusinessCreate, BusinessUpdate, CounterCreate, ServiceCreate


def _business(**overrides):
    payload = dict(name="Cuts & Co", category="salon", contact_email="Owner@Example.com")
    payload.update(overrides)
    return payload


def test_business_create_lowercases_and_trims_email():
    business = BusinessCreate(**_business())
    assert business.contact_email == "owner@example.com"


def test_business_create_rejects_email_without_at_sign():
    with pytest.raises(ValidationError):
        BusinessCreate(**_business(contact_email="not-an-email"))


def test_business_create_rejects_blank_name():
    with pytest.raises(ValidationError):
        BusinessCreate(**_business(name="   "))


@pytest.mark.parametrize(
    "raw, expected",
    [
        ("+91 98765 43210", "+919876543210"),
        ("(987) 654-3210", "9876543210"),
        ("   ", None),
        (None, None),
    ],
)
def test_business_create_normalizes_phone_formatting(raw, expected):
    business = BusinessCreate(**_business(contact_phone=raw))
    assert business.contact_phone == expected


def test_business_create_defaults_match_prd_cold_start_values():
    business = BusinessCreate(**_business())
    assert business.grace_timer_minutes == 5
    assert business.hold_window_minutes == 15
    assert business.almost_up_threshold == 2


@pytest.mark.parametrize("field", ["grace_timer_minutes", "hold_window_minutes"])
def test_business_create_rejects_zero_or_negative_timers(field):
    with pytest.raises(ValidationError):
        BusinessCreate(**_business(**{field: 0}))


def test_business_update_allows_partial_payload():
    update = BusinessUpdate(grace_timer_minutes=8)
    changes = update.model_dump(exclude_unset=True)
    assert changes == {"grace_timer_minutes": 8}


def test_business_update_still_validates_touched_fields():
    with pytest.raises(ValidationError):
        BusinessUpdate(contact_email="nope")


def test_service_create_rejects_blank_name():
    with pytest.raises(ValidationError):
        ServiceCreate(name="  ")


def test_service_create_defaults_estimated_minutes():
    service = ServiceCreate(name="Haircut")
    assert service.estimated_minutes == 10


def test_counter_create_rejects_blank_label():
    with pytest.raises(ValidationError):
        CounterCreate(label=" ")


def test_counter_create_defaults_to_no_service_restriction():
    counter = CounterCreate(label="Counter 1")
    assert counter.allowed_service_ids == []
