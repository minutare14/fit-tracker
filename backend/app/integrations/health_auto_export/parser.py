from app.schemas.health_auto_export import HealthAutoExportWebhookPayload


class HealthAutoExportParser:
    METRIC_MAP = {
        "heart_rate_variability_sdnn": "HRV",
        "resting_heart_rate": "RHR",
        "sleep_analysis": "Sleep",
        "body_mass": "Weight",
        "active_energy": "ActiveCalories",
        "basal_energy_burned": "BasalCalories",
        "step_count": "Steps",
        "apple_exercise_time": "ExerciseTime",
        "dietary_energy": "Calories",
        "carbohydrates": "Carbs",
        "protein": "Protein",
        "total_fat": "Fat",
        "fiber": "Fiber",
        "dietary_water": "Water",
    }

    @classmethod
    def normalize_metric_name(cls, raw_name: str) -> str | None:
        return cls.METRIC_MAP.get(raw_name)

    @staticmethod
    def extract_metrics(payload: HealthAutoExportWebhookPayload):
        return payload.data.metrics
