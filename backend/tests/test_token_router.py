"""Integration tests for the token state machine's HTTP surface — the
Waiting -> Called -> Done happy path and the owner-guarded transitions,
exercised through real FastAPI routing with a fake Supabase underneath."""

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.auth import get_current_user_id
from app.routers import token as token_router
from tests.fake_supabase import FakeSupabaseClient

OWNER_ID = "owner-1"


@pytest.fixture
def client(fake_client: FakeSupabaseClient, monkeypatch):
    monkeypatch.setattr(token_router, "get_supabase", lambda: fake_client)

    app = FastAPI()
    app.include_router(token_router.router)
    app.dependency_overrides[get_current_user_id] = lambda: OWNER_ID

    fake_client.tables["businesses"] = [
        {
            "id": "b1",
            "owner_id": OWNER_ID,
            "is_paused": False,
            "default_service_time_minutes": 10,
        }
    ]
    fake_client.tables["counters"] = [
        {"id": "c1", "business_id": "b1", "label": "Counter 1", "active": True}
    ]

    return TestClient(app)


def _issue_token(client: TestClient) -> dict:
    res = client.post("/api/business/b1/token", json={"service_ids": []})
    assert res.status_code == 200, res.text
    return res.json()


def test_issue_token_starts_waiting_at_position_one(client):
    token = _issue_token(client)
    assert token["status"] == "waiting"
    assert token["position"] == 1


def test_issue_token_positions_increment(client):
    _issue_token(client)
    second = _issue_token(client)
    assert second["position"] == 2


def test_issue_token_rejected_when_business_is_paused(client, fake_client):
    fake_client.tables["businesses"][0]["is_paused"] = True
    res = client.post("/api/business/b1/token", json={"service_ids": []})
    assert res.status_code == 409


def test_issue_token_rejected_for_unknown_business(client):
    res = client.post("/api/business/does-not-exist/token", json={"service_ids": []})
    assert res.status_code == 404


def test_call_next_moves_waiting_token_to_called(client):
    token = _issue_token(client)
    res = client.post(f"/api/token/{token['id']}/call?counter_id=c1")
    assert res.status_code == 200, res.text
    assert res.json()["status"] == "called"
    assert res.json()["counter_id"] == "c1"


def test_call_next_rejects_a_counter_already_serving_someone(client):
    first = _issue_token(client)
    second = _issue_token(client)
    client.post(f"/api/token/{first['id']}/call?counter_id=c1")

    res = client.post(f"/api/token/{second['id']}/call?counter_id=c1")
    assert res.status_code == 409


def test_call_next_rejects_disabled_counter(client, fake_client):
    fake_client.tables["counters"][0]["active"] = False
    token = _issue_token(client)
    res = client.post(f"/api/token/{token['id']}/call?counter_id=c1")
    assert res.status_code == 409


def test_full_happy_path_waiting_to_done(client):
    token = _issue_token(client)
    token_id = token["id"]

    called = client.post(f"/api/token/{token_id}/call?counter_id=c1").json()
    assert called["status"] == "called"

    served = client.post(f"/api/token/{token_id}/serve").json()
    assert served["status"] == "done"


def test_no_show_flow_skip_then_restore(client):
    token = _issue_token(client)
    token_id = token["id"]
    client.post(f"/api/token/{token_id}/call?counter_id=c1")

    skipped = client.post(f"/api/token/{token_id}/skip").json()
    assert skipped["status"] == "skipped"

    restored = client.post(f"/api/token/{token_id}/restore").json()
    assert restored["status"] == "restored"


def test_cannot_serve_a_token_that_was_never_called(client):
    token = _issue_token(client)
    res = client.post(f"/api/token/{token['id']}/serve")
    assert res.status_code == 409


def test_cannot_restore_a_token_that_was_never_skipped(client):
    token = _issue_token(client)
    res = client.post(f"/api/token/{token['id']}/restore")
    assert res.status_code == 409


def test_customer_can_cancel_their_own_waiting_ticket_without_auth(client):
    token = _issue_token(client)
    res = client.post(f"/api/token/{token['id']}/cancel")
    assert res.status_code == 200
    assert res.json()["status"] == "cancelled"


def test_cannot_cancel_an_already_called_ticket(client):
    token = _issue_token(client)
    client.post(f"/api/token/{token['id']}/call?counter_id=c1")
    res = client.post(f"/api/token/{token['id']}/cancel")
    assert res.status_code == 409


def test_queue_actions_require_the_business_owner(fake_client, monkeypatch):
    monkeypatch.setattr(token_router, "get_supabase", lambda: fake_client)
    fake_client.tables["businesses"] = [{"id": "b1", "owner_id": OWNER_ID, "is_paused": False}]
    fake_client.tables["counters"] = [
        {"id": "c1", "business_id": "b1", "label": "Counter 1", "active": True}
    ]

    app = FastAPI()
    app.include_router(token_router.router)
    app.dependency_overrides[get_current_user_id] = lambda: "someone-else"
    other_owner_client = TestClient(app)

    token = other_owner_client.post("/api/business/b1/token", json={"service_ids": []}).json()
    res = other_owner_client.post(f"/api/token/{token['id']}/call?counter_id=c1")
    assert res.status_code == 403


def test_token_status_reports_position_and_tokens_ahead(client):
    first = _issue_token(client)
    second = _issue_token(client)

    res = client.get(f"/api/token/{second['id']}/status")
    assert res.status_code == 200
    body = res.json()
    assert body["tokens_ahead"] == 1
    assert body["position_in_queue"] == 2

    res_first = client.get(f"/api/token/{first['id']}/status")
    assert res_first.json()["tokens_ahead"] == 0
