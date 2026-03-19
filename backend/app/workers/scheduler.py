from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.core.config import settings


def create_scheduler() -> AsyncIOScheduler | None:
    if not settings.enable_scheduler:
        return None

    return AsyncIOScheduler(timezone=settings.scheduler_timezone)
