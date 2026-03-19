from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db_session
from app.schemas.hevy import (
    HevyConnectionCreate,
    HevyExerciseTemplateRead,
    HevyStatusRead,
    HevySyncRequest,
    HevySyncResult,
    HevyWorkoutRead,
)
from app.services.hevy_service import HevyService

router = APIRouter()


@router.get("/status", response_model=HevyStatusRead)
async def get_hevy_status(
    user_id: str = Query(default="default-user"),
    session: AsyncSession = Depends(get_db_session),
) -> HevyStatusRead:
    return await HevyService(session).get_status(user_id)


@router.post("/connections", response_model=HevyStatusRead, status_code=status.HTTP_201_CREATED)
async def create_hevy_connection(
    payload: HevyConnectionCreate,
    session: AsyncSession = Depends(get_db_session),
) -> HevyStatusRead:
    return await HevyService(session).configure_connection(payload)


@router.post("/sync/exercise-templates", response_model=HevySyncResult)
async def sync_hevy_exercise_templates(
    payload: HevySyncRequest,
    session: AsyncSession = Depends(get_db_session),
) -> HevySyncResult:
    return await HevyService(session).sync_exercise_templates(payload.user_id)


@router.post("/sync/workouts", response_model=HevySyncResult)
async def sync_hevy_workouts(
    payload: HevySyncRequest,
    session: AsyncSession = Depends(get_db_session),
) -> HevySyncResult:
    return await HevyService(session).sync_workouts(payload.user_id, payload.mode)


@router.get("/exercise-templates", response_model=list[HevyExerciseTemplateRead])
async def list_hevy_exercise_templates(
    user_id: str = Query(default="default-user"),
    search: str | None = Query(default=None),
    session: AsyncSession = Depends(get_db_session),
) -> list[HevyExerciseTemplateRead]:
    return await HevyService(session).list_exercise_templates(user_id, search)


@router.get("/workouts", response_model=list[HevyWorkoutRead])
async def list_hevy_workouts(
    user_id: str = Query(default="default-user"),
    limit: int = Query(default=20, ge=1, le=100),
    session: AsyncSession = Depends(get_db_session),
) -> list[HevyWorkoutRead]:
    return await HevyService(session).list_workouts(user_id, limit)
