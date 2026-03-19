from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db_session
from app.schemas.recovery import RecoveryOverviewRead
from app.services.recovery_service import RecoveryService

router = APIRouter(prefix="/recovery")


@router.get("/overview", response_model=RecoveryOverviewRead)
async def get_recovery_overview(
    user_id: str = Query(default="default-user", alias="userId"),
    session: AsyncSession = Depends(get_db_session),
) -> RecoveryOverviewRead:
    return await RecoveryService(session).get_overview(user_id)
