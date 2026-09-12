import pytest

from app.services import eta


def test_ticket_duration_uses_catalog_estimate_with_no_history():
    services = [{"service_id": "haircut", "estimated_minutes": 15}]
    assert eta.ticket_duration_minutes(services, 10, {}) == 15


def test_ticket_duration_prefers_rolling_average_when_available():
    services = [{"service_id": "haircut", "estimated_minutes": 15}]
    assert eta.ticket_duration_minutes(services, 10, {"haircut": 22.0}) == 22.0


def test_ticket_duration_sums_multiple_services():
    services = [
        {"service_id": "haircut", "estimated_minutes": 15},
        {"service_id": "beard", "estimated_minutes": 10},
    ]
    assert eta.ticket_duration_minutes(services, 10, {}) == 25


def test_ticket_duration_falls_back_to_default_with_no_services():
    assert eta.ticket_duration_minutes([], 12, {"haircut": 22.0}) == 12


def test_counter_busy_until_is_zero_for_idle_counter():
    assert eta.counter_busy_until_minutes(None, None, 10, {}) == 0.0


def test_counter_busy_until_never_goes_negative_past_expected_finish():
    services = [{"service_id": "haircut", "estimated_minutes": 10}]
    called_20_minutes_ago = "2000-01-01T00:00:00+00:00"
    assert eta.counter_busy_until_minutes(services, called_20_minutes_ago, 10, {}) == 0.0


def test_simulate_wait_minutes_picks_the_soonest_free_counter():
    counters = [
        {"id": "a", "allowed_service_ids": set(), "busy_until": 5.0},
        {"id": "b", "allowed_service_ids": set(), "busy_until": 0.0},
    ]
    wait = eta.simulate_wait_minutes(
        my_duration_minutes=10, my_service_ids=set(), ahead=[], counters=counters
    )
    assert wait == 0.0


def test_simulate_wait_minutes_accounts_for_tickets_ahead():
    counters = [{"id": "a", "allowed_service_ids": set(), "busy_until": 0.0}]
    ahead = [{"duration": 15.0, "service_ids": set()}]
    wait = eta.simulate_wait_minutes(
        my_duration_minutes=10, my_service_ids=set(), ahead=ahead, counters=counters
    )
    assert wait == 15.0


def test_simulate_wait_minutes_respects_counter_service_restrictions():
    counters = [
        {"id": "wash-only", "allowed_service_ids": {"wash"}, "busy_until": 0.0},
        {"id": "cuts-only", "allowed_service_ids": {"haircut"}, "busy_until": 100.0},
    ]
    # A haircut ticket ahead must land on "cuts-only", leaving "wash-only" free
    # for my wash ticket even though it queued behind.
    ahead = [{"duration": 20.0, "service_ids": {"haircut"}}]
    wait = eta.simulate_wait_minutes(
        my_duration_minutes=5, my_service_ids={"wash"}, ahead=ahead, counters=counters
    )
    assert wait == 0.0


def test_simulate_wait_minutes_degrades_to_any_counter_when_no_counter_is_eligible():
    counters = [{"id": "a", "allowed_service_ids": {"haircut"}, "busy_until": 3.0}]
    wait = eta.simulate_wait_minutes(
        my_duration_minutes=5, my_service_ids={"unlisted-service"}, ahead=[], counters=counters
    )
    assert wait == 3.0


def test_simulate_wait_minutes_with_no_counters_configured():
    wait = eta.simulate_wait_minutes(
        my_duration_minutes=5, my_service_ids=set(), ahead=[], counters=[]
    )
    assert wait == 0.0


def test_estimate_wait_minutes_shop_wide_fallback():
    assert eta.estimate_wait_minutes(
        tokens_ahead=4, active_counters=2, recent_service_minutes=[], default_service_time_minutes=10
    ) == 20.0


def test_estimate_wait_minutes_uses_recent_average_when_present():
    wait = eta.estimate_wait_minutes(
        tokens_ahead=2,
        active_counters=1,
        recent_service_minutes=[10.0, 20.0],
        default_service_time_minutes=99,
    )
    assert wait == 30.0


def test_estimate_wait_minutes_guards_against_zero_counters():
    wait = eta.estimate_wait_minutes(
        tokens_ahead=2, active_counters=0, recent_service_minutes=[], default_service_time_minutes=10
    )
    assert wait == 20.0


def test_compute_service_rolling_averages_attributes_duration_by_estimate_share(fake_client):
    fake_client.tables["tokens"] = [
        {
            "id": "t1",
            "business_id": "b1",
            "status": "done",
            "called_at": "2024-01-01T00:00:00+00:00",
            "served_at": "2024-01-01T00:25:00+00:00",
        }
    ]
    fake_client.tables["token_services"] = [
        {"token_id": "t1", "service_id": "haircut", "estimated_minutes": 15},
        {"token_id": "t1", "service_id": "beard", "estimated_minutes": 10},
    ]

    averages = eta.compute_service_rolling_averages(fake_client, "b1")

    # 25 actual minutes split 15:10 between the two services.
    assert averages["haircut"] == pytest.approx(15.0)
    assert averages["beard"] == pytest.approx(10.0)


def test_compute_service_rolling_averages_ignores_catalog_less_tickets(fake_client):
    fake_client.tables["tokens"] = [
        {
            "id": "t1",
            "business_id": "b1",
            "status": "done",
            "called_at": "2024-01-01T00:00:00+00:00",
            "served_at": "2024-01-01T00:10:00+00:00",
        }
    ]
    fake_client.tables["token_services"] = []

    assert eta.compute_service_rolling_averages(fake_client, "b1") == {}
