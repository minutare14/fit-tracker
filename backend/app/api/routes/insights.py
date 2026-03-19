from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db_session
from app.schemas.insights import InsightsOverviewRead
from app.services.insights_service import InsightsService

router = APIRouter(prefix="/insights")


@router.get("/overview", response_model=InsightsOverviewRead)
async def get_insights_overview(
    user_id: str = Query(default="default-user", alias="userId"),
    session: AsyncSession = Depends(get_db_session),
) -> InsightsOverviewRead:
    return await InsightsService(session).get_overview(user_id)
