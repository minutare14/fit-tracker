from fastapi import APIRouter

from app.api.routes import bjj_sessions, bjj_techniques, dashboard, health, hevy, insights, metrics, recovery, settings, webhooks, weight, nutrition

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(hevy.router, prefix="/hevy", tags=["hevy"])
api_router.include_router(webhooks.router, prefix="/webhooks", tags=["webhooks"])
api_router.include_router(metrics.router, prefix="/metrics", tags=["metrics"])
api_router.include_router(settings.router, tags=["settings"])
api_router.include_router(dashboard.router, tags=["dashboard"])
api_router.include_router(recovery.router, tags=["recovery"])
api_router.include_router(insights.router, tags=["insights"])
api_router.include_router(bjj_sessions.router, tags=["bjj-sessions"])
api_router.include_router(bjj_techniques.router, tags=["bjj-techniques"])
api_router.include_router(weight.router, tags=["weight"])
api_router.include_router(nutrition.router, tags=["nutrition"])

