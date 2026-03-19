class InsightsService:
    async def generate_daily_insights(self, user_id: str) -> dict:
        return {
            "user_id": user_id,
            "status": "pending",
            "message": "Insights layer scaffolded; derivations should feed this service next.",
        }
