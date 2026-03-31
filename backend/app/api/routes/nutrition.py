from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db_session
from app.schemas.nutrition import NutritionHistoryRead, NutritionOverviewRead
from app.services.nutrition_service import NutritionService

router = APIRouter(prefix="/nutrition")


@router.get("/history", response_model=NutritionHistoryRead)
async def get_nutrition_history(
    user_id: str = Query(default="default-user", alias="userId"),
    days: int = Query(default=30, ge=1, le=365),
    session: AsyncSession = Depends(get_db_session),
) -> NutritionHistoryRead:
    return await NutritionService(session).get_history(user_id, days)


@router.get("/overview", response_model=NutritionOverviewRead)
async def get_nutrition_overview(
    user_id: str = Query(default="default-user", alias="userId"),
    session: AsyncSession = Depends(get_db_session),
) -> NutritionOverviewRead:
    return await NutritionService(session).get_overview(user_id)
