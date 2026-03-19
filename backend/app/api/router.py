from fastapi import APIRouter

from app.api.routes import health, hevy, metrics, webhooks

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(hevy.router, prefix="/hevy", tags=["hevy"])
api_router.include_router(webhooks.router, prefix="/webhooks", tags=["webhooks"])
api_router.include_router(metrics.router, prefix="/metrics", tags=["metrics"])
