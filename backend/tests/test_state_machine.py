"""Covers the auto-skip / auto-expire / almost-up sweep — per the PRD, the
highest-risk, highest-value part of the system, since the owner never
manually decides a no-show."""

import pytest

from tests.conftest import minutes_ago

from app.services.state_machine import sweep_expirations


def _business(**overrides):
    business = {
        "id": "b1",
        "grace_timer_minutes": 5,
        "hold_window_minutes": 15,
        "almost_up_threshold": 2,
    }
    business.update(overrides)
    return business


def test_called_token_past_grace_timer_is_auto_skipped(fake_client):
    fake_client.tables["businesses"] = [_business()]
    fake_client.tables["tokens"] = [
        {"id": "t1", "business_id": "b1", "status": "called", "called_at": minutes_ago(6)}
    ]

    result = sweep_expirations(fake_client)

    assert result["skipped"] == 1
    token = fake_client.tables["tokens"][0]
    assert token["status"] == "skipped"
    assert token["skipped_at"] is not None


def test_called_token_within_grace_timer_is_left_alone(fake_client):
    fake_client.tables["businesses"] = [_business()]
    fake_client.tables["tokens"] = [
        {"id": "t1", "business_id": "b1", "status": "called", "called_at": minutes_ago(2)}
    ]

    result = sweep_expirations(fake_client)

    assert result["skipped"] == 0
    assert fake_client.tables["tokens"][0]["status"] == "called"


def test_skipped_token_past_hold_window_is_auto_expired(fake_client):
    fake_client.tables["businesses"] = [_business()]
    fake_client.tables["tokens"] = [
        {"id": "t1", "business_id": "b1", "status": "skipped", "skipped_at": minutes_ago(16)}
    ]

    result = sweep_expirations(fake_client)

    assert result["expired"] == 1
    assert fake_client.tables["tokens"][0]["status"] == "expired"


def test_skipped_token_within_hold_window_is_left_alone(fake_client):
    fake_client.tables["businesses"] = [_business()]
    fake_client.tables["tokens"] = [
        {"id": "t1", "business_id": "b1", "status": "skipped", "skipped_at": minutes_ago(5)}
    ]

    result = sweep_expirations(fake_client)

    assert result["expired"] == 0
    assert fake_client.tables["tokens"][0]["status"] == "skipped"


def test_almost_up_alert_fires_once_for_a_token_near_the_front(fake_client):
    fake_client.tables["businesses"] = [_business(almost_up_threshold=2)]
    fake_client.tables["tokens"] = [
        {"id": "t1", "business_id": "b1", "status": "waiting", "position": 1},
        {"id": "t2", "business_id": "b1", "status": "waiting", "position": 2},
    ]
    fake_client.tables["notification_log"] = []

    first = sweep_expirations(fake_client)
    assert first["almost_up"] == 2  # both are within 2 tokens of the front (indices 0 and 1)

    second = sweep_expirations(fake_client)
    assert second["almost_up"] == 0  # already logged, not re-sent


def test_almost_up_alert_skips_tokens_beyond_the_threshold(fake_client):
    fake_client.tables["businesses"] = [_business(almost_up_threshold=1)]
    fake_client.tables["tokens"] = [
        {"id": "t1", "business_id": "b1", "status": "waiting", "position": 1},
        {"id": "t2", "business_id": "b1", "status": "waiting", "position": 2},
        {"id": "t3", "business_id": "b1", "status": "waiting", "position": 3},
    ]
    fake_client.tables["notification_log"] = []

    result = sweep_expirations(fake_client)

    # threshold 1 means indices 0 and 1 qualify, index 2 (2 people ahead) does not.
    assert result["almost_up"] == 2


@pytest.mark.parametrize("threshold", [0, -1])
def test_almost_up_disabled_when_threshold_is_zero_or_negative(fake_client, threshold):
    fake_client.tables["businesses"] = [_business(almost_up_threshold=threshold)]
    fake_client.tables["tokens"] = [
        {"id": "t1", "business_id": "b1", "status": "waiting", "position": 1},
    ]
    fake_client.tables["notification_log"] = []

    result = sweep_expirations(fake_client)

    assert result["almost_up"] == 0


def test_called_token_does_not_count_toward_almost_up_alerts(fake_client):
    fake_client.tables["businesses"] = [_business(almost_up_threshold=5)]
    fake_client.tables["tokens"] = [
        {"id": "t1", "business_id": "b1", "status": "called", "position": 1, "called_at": minutes_ago(1)},
        {"id": "t2", "business_id": "b1", "status": "waiting", "position": 2},
    ]
    fake_client.tables["notification_log"] = []

    result = sweep_expirations(fake_client)

    # t1 is called (not eligible for its own almost-up alert), t2 is index 1.
    assert result["almost_up"] == 1
    assert fake_client.tables["notification_log"][0]["token_id"] == "t2"


def test_multiple_businesses_are_swept_independently(fake_client):
    fake_client.tables["businesses"] = [_business(id="b1"), _business(id="b2")]
    fake_client.tables["tokens"] = [
        {"id": "t1", "business_id": "b1", "status": "called", "called_at": minutes_ago(10)},
        {"id": "t2", "business_id": "b2", "status": "called", "called_at": minutes_ago(1)},
    ]

    result = sweep_expirations(fake_client)

    assert result["skipped"] == 1
    tokens_by_id = {t["id"]: t for t in fake_client.tables["tokens"]}
    assert tokens_by_id["t1"]["status"] == "skipped"
    assert tokens_by_id["t2"]["status"] == "called"
