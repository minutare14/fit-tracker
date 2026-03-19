from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db_session
from app.schemas.dashboard import DashboardOverviewRead
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/dashboard")


@router.get("/overview", response_model=DashboardOverviewRead)
async def get_dashboard_overview(
    user_id: str = Query(default="default-user", alias="userId"),
    session: AsyncSession = Depends(get_db_session),
) -> DashboardOverviewRead:
    return await DashboardService(session).get_overview(user_id)
