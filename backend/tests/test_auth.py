import pytest
from fastapi import HTTPException

from app.auth import get_current_user_id, require_business_owner


def test_get_current_user_id_rejects_missing_header():
    with pytest.raises(HTTPException) as exc_info:
        get_current_user_id(authorization=None)
    assert exc_info.value.status_code == 401


def test_get_current_user_id_rejects_non_bearer_header():
    with pytest.raises(HTTPException) as exc_info:
        get_current_user_id(authorization="Basic abc123")
    assert exc_info.value.status_code == 401


def test_get_current_user_id_rejects_invalid_token(monkeypatch):
    def fake_verify(token):
        from app.auth import InvalidTokenError

        raise InvalidTokenError("nope")

    monkeypatch.setattr("app.auth.verify_access_token", fake_verify)
    with pytest.raises(HTTPException) as exc_info:
        get_current_user_id(authorization="Bearer bad-token")
    assert exc_info.value.status_code == 401


def test_get_current_user_id_returns_verified_user_id(monkeypatch):
    monkeypatch.setattr("app.auth.verify_access_token", lambda token: "user-42")
    assert get_current_user_id(authorization="Bearer good-token") == "user-42"


def test_require_business_owner_raises_404_when_business_missing(fake_client):
    with pytest.raises(HTTPException) as exc_info:
        require_business_owner(fake_client, "missing-business", "user-1")
    assert exc_info.value.status_code == 404


def test_require_business_owner_raises_403_for_a_different_owner(fake_client):
    fake_client.tables["businesses"] = [{"id": "b1", "owner_id": "owner-a"}]
    with pytest.raises(HTTPException) as exc_info:
        require_business_owner(fake_client, "b1", "owner-b")
    assert exc_info.value.status_code == 403


def test_require_business_owner_passes_for_the_actual_owner(fake_client):
    fake_client.tables["businesses"] = [{"id": "b1", "owner_id": "owner-a"}]
    require_business_owner(fake_client, "b1", "owner-a")  # should not raise
