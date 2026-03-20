from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db_session
from app.schemas.nutrition import NutritionOverviewRead
from app.services.nutrition_service import NutritionService

router = APIRouter(prefix="/nutrition")


@router.get("/overview", response_model=NutritionOverviewRead)
async def get_nutrition_overview(
    user_id: str = Query(default="default-user", alias="userId"),
    session: AsyncSession = Depends(get_db_session),
) -> NutritionOverviewRead:
    return await NutritionService(session).get_overview(user_id)
