from __future__ import annotations

from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db_session
from app.schemas.settings import (
    AISettingsRead,
    AISettingsWrite,
    AutoExportSettingsWrite,
    HealthAutoExportSettingsRead,
    HevySettingsRead,
    HevySettingsWrite,
    HevySyncRequest,
    HevyTestRequest,
    SettingsIntegrationsRead,
)
from app.schemas.profile import ProfileRead, ProfileUpdate, ProfileWriteResult
from app.schemas.hevy import HevySyncResult
from app.services.profile_service import ProfileService
from app.services.settings_service import SettingsService

router = APIRouter(prefix="/settings")


@router.get("/profile", response_model=ProfileRead)
async def get_profile(
    user_id: str = Query(default="default-user", alias="userId"),
    session: AsyncSession = Depends(get_db_session),
) -> ProfileRead:
    return await ProfileService(session).get_profile(user_id)


@router.put("/profile", response_model=ProfileWriteResult)
async def update_profile(
    payload: ProfileUpdate,
    session: AsyncSession = Depends(get_db_session),
) -> ProfileWriteResult:
    return await ProfileService(session).update_profile(payload)


@router.get("/integrations", response_model=SettingsIntegrationsRead)
async def get_integrations(
    request: Request,
    user_id: str = Query(default="default-user", alias="userId"),
    session: AsyncSession = Depends(get_db_session),
) -> SettingsIntegrationsRead:
    origin = str(request.base_url).rstrip("/")
    return await SettingsService(session).get_integrations(user_id, origin)


@router.put("/integrations/hevy", response_model=HevySettingsRead)
async def save_hevy_settings(
    payload: HevySettingsWrite,
    session: AsyncSession = Depends(get_db_session),
) -> HevySettingsRead:
    return await SettingsService(session).save_hevy_settings(payload)


@router.post("/integrations/hevy/test")
async def test_hevy_settings(
    payload: HevyTestRequest,
    session: AsyncSession = Depends(get_db_session),
) -> dict[str, bool]:
    return await SettingsService(session).test_hevy_settings(payload)


@router.post("/integrations/hevy/sync", response_model=HevySyncResult, status_code=status.HTTP_202_ACCEPTED)
async def sync_hevy(
    payload: HevySyncRequest,
    session: AsyncSession = Depends(get_db_session),
) -> HevySyncResult:
    return await SettingsService(session).run_hevy_sync(payload)


@router.put("/integrations/autoexport", response_model=HealthAutoExportSettingsRead)
async def save_autoexport_settings(
    request: Request,
    payload: AutoExportSettingsWrite,
    session: AsyncSession = Depends(get_db_session),
):
    origin = str(request.base_url).rstrip("/")
    return await SettingsService(session).save_autoexport_settings(payload, origin)


@router.put("/integrations/ai", response_model=AISettingsRead)
async def save_ai_settings(
    payload: AISettingsWrite,
    session: AsyncSession = Depends(get_db_session),
) -> AISettingsRead:
    return await SettingsService(session).save_ai_settings(payload)
