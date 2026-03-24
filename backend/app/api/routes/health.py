from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db_session
from app.core.config import settings

router = APIRouter()


@router.get("/health")
async def healthcheck() -> dict[str, str]:
    return {
        "status": "ok",
        "appName": settings.app_name,
        "env": settings.app_env
    }


@router.get("/health/db")
async def database_healthcheck(session: AsyncSession = Depends(get_db_session)):
    try:
        await session.execute(text("select 1"))
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": "Database connection failed", "details": str(e)}
        )
