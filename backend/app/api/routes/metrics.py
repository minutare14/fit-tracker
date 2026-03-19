from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db_session
from app.schemas.metrics import DailyRollupRead
from app.services.metrics_service import MetricsService

router = APIRouter()


@router.get("/daily-rollups", response_model=list[DailyRollupRead])
async def list_daily_rollups(
    user_id: str = Query(default="default-user"),
    days: int = Query(default=30, ge=1, le=365),
    session: AsyncSession = Depends(get_db_session),
) -> list[DailyRollupRead]:
    return await MetricsService(session).get_daily_rollups(user_id, days)
