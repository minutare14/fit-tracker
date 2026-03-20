from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db_session
from app.schemas.weight import (
    WeightEntryCreate,
    WeightEntryRead,
    WeightOverviewRead,
)
from app.services.weight_service import WeightService

router = APIRouter(prefix="/weight")


@router.get("/overview", response_model=WeightOverviewRead)
async def get_weight_overview(
    user_id: str = Query(default="default-user", alias="userId"),
    session: AsyncSession = Depends(get_db_session),
) -> WeightOverviewRead:
    return await WeightService(session).get_overview(user_id)


@router.get("/entries", response_model=list[WeightEntryRead])
async def list_weight_entries(
    user_id: str = Query(default="default-user", alias="userId"),
    session: AsyncSession = Depends(get_db_session),
) -> list[WeightEntryRead]:
    return await WeightService(session).list_entries(user_id)


@router.post("/entries", response_model=WeightEntryRead, status_code=status.HTTP_201_CREATED)
async def create_weight_entry(
    payload: WeightEntryCreate,
    session: AsyncSession = Depends(get_db_session),
) -> WeightEntryRead:
    return await WeightService(session).create_entry(payload)


@router.delete("/entries/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_weight_entry(
    entry_id: str,
    user_id: str = Query(default="default-user", alias="userId"),
    session: AsyncSession = Depends(get_db_session),
) -> Response:
    await WeightService(session).delete_entry(user_id, entry_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
