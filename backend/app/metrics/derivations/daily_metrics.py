def calculate_recovery_score(hrv: float | None, sleep_seconds: float | None) -> int:
    if not hrv or not sleep_seconds:
        return 70

    hrv_score = min((hrv / 80.0) * 100.0, 100.0)
    sleep_score = min((sleep_seconds / 28800.0) * 100.0, 100.0)
    return int((hrv_score * 0.6) + (sleep_score * 0.4))


def readiness_label(recovery_score: int) -> str:
    if recovery_score >= 85:
        return "high"
    if recovery_score >= 70:
        return "moderate"
    return "low"
