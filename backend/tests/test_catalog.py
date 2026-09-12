from app.services.catalog import hydrate_token, load_counters, load_token_services


def test_hydrate_token_attaches_matching_services():
    token_row = {"id": "t1", "status": "waiting"}
    services_by_token = {"t1": [{"service_name": "Haircut"}]}
    hydrated = hydrate_token(token_row, services_by_token)
    assert hydrated["services"] == [{"service_name": "Haircut"}]
    assert hydrated["id"] == "t1"


def test_hydrate_token_defaults_to_empty_list_when_no_services():
    hydrated = hydrate_token({"id": "t1"}, {})
    assert hydrated["services"] == []


def test_load_token_services_groups_rows_by_token(fake_client):
    fake_client.tables["token_services"] = [
        {"token_id": "t1", "service_id": "s1", "service_name": "Haircut", "estimated_minutes": 15},
        {"token_id": "t1", "service_id": "s2", "service_name": "Beard", "estimated_minutes": 10},
        {"token_id": "t2", "service_id": "s1", "service_name": "Haircut", "estimated_minutes": 15},
    ]
    result = load_token_services(fake_client, ["t1", "t2"])
    assert len(result["t1"]) == 2
    assert len(result["t2"]) == 1


def test_load_token_services_short_circuits_on_empty_ids(fake_client):
    assert load_token_services(fake_client, []) == {}


def test_load_counters_attaches_allowed_service_ids(fake_client):
    fake_client.tables["counters"] = [
        {"id": "c1", "business_id": "b1", "label": "Counter 1", "active": True},
        {"id": "c2", "business_id": "b1", "label": "Counter 2", "active": True},
    ]
    fake_client.tables["counter_services"] = [
        {"counter_id": "c1", "service_id": "s1"},
    ]
    counters = load_counters(fake_client, "b1")
    by_id = {c["id"]: c for c in counters}
    assert by_id["c1"]["allowed_service_ids"] == ["s1"]
    assert by_id["c2"]["allowed_service_ids"] == []


def test_load_counters_returns_empty_list_for_business_with_none(fake_client):
    assert load_counters(fake_client, "no-such-business") == []
