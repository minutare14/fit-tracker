from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db_session
from app.schemas.bjj_sessions import (
    BjjSessionCreate,
    BjjSessionRead,
    BjjSessionsOverview,
    BjjSessionUpdate,
)
from app.services.bjj_sessions_service import BjjSessionsService

router = APIRouter(prefix="/bjj-sessions")


@router.get("", response_model=BjjSessionsOverview)
async def list_bjj_sessions(
    user_id: str = Query(default="default-user", alias="userId"),
    session: AsyncSession = Depends(get_db_session),
) -> BjjSessionsOverview:
    return await BjjSessionsService(session).list_sessions(user_id)


@router.post("", response_model=BjjSessionRead, status_code=status.HTTP_201_CREATED)
async def create_bjj_session(
    payload: BjjSessionCreate,
    session: AsyncSession = Depends(get_db_session),
) -> BjjSessionRead:
    return await BjjSessionsService(session).create_session(payload)


@router.get("/{session_id}", response_model=BjjSessionRead)
async def get_bjj_session(
    session_id: str,
    user_id: str = Query(default="default-user", alias="userId"),
    session: AsyncSession = Depends(get_db_session),
) -> BjjSessionRead:
    return await BjjSessionsService(session).get_session(user_id, session_id)


@router.put("/{session_id}", response_model=BjjSessionRead)
async def update_bjj_session(
    session_id: str,
    payload: BjjSessionUpdate,
    session: AsyncSession = Depends(get_db_session),
) -> BjjSessionRead:
    return await BjjSessionsService(session).update_session(payload, session_id)


@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_bjj_session(
    session_id: str,
    user_id: str = Query(default="default-user", alias="userId"),
    session: AsyncSession = Depends(get_db_session),
) -> Response:
    await BjjSessionsService(session).delete_session(user_id, session_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
