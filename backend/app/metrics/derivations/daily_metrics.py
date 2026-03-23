def calculate_recovery_score(hrv: float | None, sleep_seconds: float | None) -> int | None:
    if hrv is None or sleep_seconds is None:
        return None

    hrv_score = min((hrv / 80.0) * 100.0, 100.0)
    sleep_score = min((sleep_seconds / 28800.0) * 100.0, 100.0)
    return int((hrv_score * 0.6) + (sleep_score * 0.4))


def readiness_label(recovery_score: int | None) -> str:
    if recovery_score is None:
        return "insufficient-data"
    if recovery_score >= 85:
        return "high"
    if recovery_score >= 70:
        return "moderate"
    return "low"


def calculate_session_load(duration_minutes: int, srpe: int) -> int:
    return max(duration_minutes, 0) * max(srpe, 0)


def calculate_acute_load(loads: list[int]) -> float | None:
    if not loads:
        return None
    return round(sum(loads[-7:]) / min(len(loads[-7:]), 7), 2)


def calculate_chronic_load(loads: list[int]) -> float | None:
    if not loads:
        return None
    return round(sum(loads[-28:]) / min(len(loads[-28:]), 28), 2)


def calculate_acwr(acute_load: float | None, chronic_load: float | None) -> float | None:
    if not acute_load or not chronic_load:
        return None
    return round(acute_load / chronic_load, 2)
