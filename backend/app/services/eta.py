"""Rolling-average ETA calculation, per PRD section 9."""

ROLLING_WINDOW = 12


def estimate_wait_minutes(
    tokens_ahead: int,
    active_counters: int,
    recent_service_minutes: list[float],
    default_service_time_minutes: float,
) -> float:
    if active_counters <= 0:
        active_counters = 1

    if recent_service_minutes:
        sample = recent_service_minutes[-ROLLING_WINDOW:]
        avg_service_minutes = sum(sample) / len(sample)
    else:
        avg_service_minutes = default_service_time_minutes

    return (tokens_ahead / active_counters) * avg_service_minutes
