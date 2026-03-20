from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db_session
from app.schemas.bjj_sessions import BjjTechniqueCreate, BjjTechniqueRead
from app.services.bjj_techniques_service import BjjTechniquesService

router = APIRouter(prefix="/bjj-techniques")


@router.get("", response_model=list[BjjTechniqueRead])
async def list_bjj_techniques(
    user_id: str = Query(default="default-user", alias="userId"),
    session: AsyncSession = Depends(get_db_session),
) -> list[BjjTechniqueRead]:
    return await BjjTechniquesService(session).list_techniques(user_id)


@router.post("", response_model=BjjTechniqueRead, status_code=status.HTTP_201_CREATED)
async def create_bjj_technique(
    payload: BjjTechniqueCreate,
    user_id: str = Query(default="default-user", alias="userId"),
    session: AsyncSession = Depends(get_db_session),
) -> BjjTechniqueRead:
    return await BjjTechniquesService(session).create_technique(user_id, payload)
