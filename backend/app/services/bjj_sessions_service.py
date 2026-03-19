from __future__ import annotations

from datetime import datetime, time, timedelta, timezone

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.metrics.derivations.daily_metrics import calculate_session_load
from app.models.performance import BjjSession
from app.repositories.integration_repository import IntegrationRepository
from app.schemas.bjj_sessions import (
    BjjSessionCreate,
    BjjSessionRead,
    BjjSessionsOverview,
    BjjSessionsSummary,
    BjjSessionUpdate,
)
from app.services.metrics_service import MetricsService
from app.core.errors import NotFoundError


def training_day(value: datetime.date) -> datetime:
    return datetime.combine(value, time(hour=12), tzinfo=timezone.utc)


class BjjSessionsService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.integration_repository = IntegrationRepository(session)
        self.metrics_service = MetricsService(session)

    async def list_sessions(self, user_id: str) -> BjjSessionsOverview:
        await self.integration_repository.ensure_user(user_id)
        query = (
            select(BjjSession)
            .where(BjjSession.user_id == user_id)
            .order_by(BjjSession.date.desc(), BjjSession.created_at.desc())
        )
        rows = list((await self.session.execute(query)).scalars().all())
        items = [self._serialize(row) for row in rows]

        last_30_days = datetime.now(timezone.utc) - timedelta(days=30)
        last_7_days = datetime.now(timezone.utc) - timedelta(days=7)

        last_30_rows = [row for row in rows if row.date >= last_30_days]
        last_7_rows = [row for row in rows if row.date >= last_7_days]

        summary = BjjSessionsSummary(
            total_sessions=len(rows),
            monthly_mat_hours=round(sum(row.duration_minutes for row in last_30_rows) / 60.0, 1),
            weekly_load=sum(row.session_load for row in last_7_rows),
            average_srpe=round(sum(row.srpe for row in rows) / len(rows), 1) if rows else None,
            last_session_at=rows[0].created_at if rows else None,
        )

        return BjjSessionsOverview(items=items, summary=summary)

    async def get_session(self, user_id: str, session_id: str) -> BjjSessionRead:
        row = await self._get_model(user_id, session_id)
        return self._serialize(row)

    async def create_session(self, payload: BjjSessionCreate) -> BjjSessionRead:
        await self.integration_repository.ensure_user(payload.user_id)
        day = training_day(payload.date)
        session = BjjSession(
            user_id=payload.user_id,
            date=day,
            start_time=payload.start_time,
            duration_minutes=payload.duration_minutes,
            training_type=payload.training_type,
            gi_mode=payload.gi_mode,
            location=payload.location,
            coach=payload.coach,
            srpe=payload.srpe,
            session_load=calculate_session_load(payload.duration_minutes, payload.srpe),
            rounds=payload.rounds,
            sparring_minutes=payload.sparring_minutes,
            drill_minutes=payload.drill_minutes,
            technique_minutes=payload.technique_minutes,
            trained_positions=payload.trained_positions,
            trained_techniques=payload.trained_techniques,
            successful_techniques=payload.successful_techniques,
            suffered_techniques=payload.suffered_techniques,
            notes=payload.notes,
            fatigue_before=payload.fatigue_before,
            pain_level=payload.pain_level,
            session_score=payload.session_score,
        )
        self.session.add(session)
        await self.session.flush()
        await self.metrics_service.refresh_daily_rollup(payload.user_id, day)
        await self.session.commit()
        return self._serialize(session)

    async def update_session(self, payload: BjjSessionUpdate, session_id: str) -> BjjSessionRead:
        row = await self._get_model(payload.user_id, session_id)
        if payload.date is not None:
            row.date = training_day(payload.date)
        if payload.start_time is not None:
            row.start_time = payload.start_time
        if payload.duration_minutes is not None:
            row.duration_minutes = payload.duration_minutes
        if payload.training_type is not None:
            row.training_type = payload.training_type
        if payload.gi_mode is not None:
            row.gi_mode = payload.gi_mode
        if payload.location is not None:
            row.location = payload.location
        if payload.coach is not None:
            row.coach = payload.coach
        if payload.srpe is not None:
            row.srpe = payload.srpe
        row.session_load = calculate_session_load(row.duration_minutes, row.srpe)
        row.rounds = payload.rounds if payload.rounds is not None else row.rounds
        row.sparring_minutes = payload.sparring_minutes if payload.sparring_minutes is not None else row.sparring_minutes
        row.drill_minutes = payload.drill_minutes if payload.drill_minutes is not None else row.drill_minutes
        row.technique_minutes = payload.technique_minutes if payload.technique_minutes is not None else row.technique_minutes
        row.trained_positions = payload.trained_positions if payload.trained_positions is not None else row.trained_positions
        row.trained_techniques = payload.trained_techniques if payload.trained_techniques is not None else row.trained_techniques
        row.successful_techniques = payload.successful_techniques if payload.successful_techniques is not None else row.successful_techniques
        row.suffered_techniques = payload.suffered_techniques if payload.suffered_techniques is not None else row.suffered_techniques
        row.notes = payload.notes if payload.notes is not None else row.notes
        row.fatigue_before = payload.fatigue_before if payload.fatigue_before is not None else row.fatigue_before
        row.pain_level = payload.pain_level if payload.pain_level is not None else row.pain_level
        row.session_score = payload.session_score if payload.session_score is not None else row.session_score
        await self.metrics_service.refresh_daily_rollup(payload.user_id, row.date)
        await self.session.commit()
        return self._serialize(row)

    async def delete_session(self, user_id: str, session_id: str) -> None:
        row = await self._get_model(user_id, session_id)
        day = row.date
        await self.session.delete(row)
        await self.session.flush()
        await self.metrics_service.refresh_daily_rollup(user_id, day)
        await self.session.commit()

    async def _get_model(self, user_id: str, session_id: str) -> BjjSession:
        query = select(BjjSession).where(
            and_(BjjSession.user_id == user_id, BjjSession.id == session_id)
        )
        row = (await self.session.execute(query)).scalar_one_or_none()
        if not row:
            raise NotFoundError("BJJ_SESSION_NOT_FOUND", "BJJ session was not found")
        return row

    def _serialize(self, row: BjjSession) -> BjjSessionRead:
        return BjjSessionRead(
            id=row.id,
            date=row.date.date(),
            start_time=row.start_time,
            duration_minutes=row.duration_minutes,
            location=row.location,
            coach=row.coach,
            training_type=row.training_type,
            gi_mode=row.gi_mode,
            srpe=row.srpe,
            rounds=row.rounds,
            sparring_minutes=row.sparring_minutes,
            drill_minutes=row.drill_minutes,
            technique_minutes=row.technique_minutes,
            trained_positions=row.trained_positions or [],
            trained_techniques=row.trained_techniques or [],
            successful_techniques=row.successful_techniques or [],
            suffered_techniques=row.suffered_techniques or [],
            notes=row.notes,
            fatigue_before=row.fatigue_before,
            pain_level=row.pain_level,
            session_score=row.session_score,
            session_load=row.session_load,
            created_at=row.created_at,
            updated_at=row.updated_at,
        )
