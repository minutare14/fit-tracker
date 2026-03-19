from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db_session

router = APIRouter()


@router.get("/health")
async def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/health/db")
async def database_healthcheck(session: AsyncSession = Depends(get_db_session)) -> dict[str, str]:
    await session.execute(text("select 1"))
    return {"status": "ok"}
