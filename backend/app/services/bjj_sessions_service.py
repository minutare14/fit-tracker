from __future__ import annotations

from collections import defaultdict
from datetime import datetime, time, timedelta, timezone

from sqlalchemy import and_, delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import NotFoundError
from app.metrics.derivations.daily_metrics import calculate_session_load
from app.models.performance import BjjSession, BjjSessionTechnique, BjjTechnique
from app.repositories.integration_repository import IntegrationRepository
from app.schemas.bjj_sessions import (
    BjjSessionCreate,
    BjjSessionRead,
    BjjSessionsOverview,
    BjjSessionsSummary,
    BjjSessionUpdate,
)
from app.services.metrics_service import MetricsService


def training_day(value: datetime.date) -> datetime:
    return datetime.combine(value, time(hour=12), tzinfo=timezone.utc)


def derive_sparring_minutes(rounds: int | None, round_duration_minutes: int | None) -> int | None:
    if rounds and round_duration_minutes:
        return rounds * round_duration_minutes
    return None


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
        techniques_map = await self._load_techniques_by_session_ids([row.id for row in rows])
        items = [self._serialize(row, techniques_map.get(row.id, {})) for row in rows]

        last_30_days = datetime.now(timezone.utc) - timedelta(days=30)
        last_7_days = datetime.now(timezone.utc) - timedelta(days=7)

        last_30_rows = [row for row in rows if row.date >= last_30_days]
        last_7_rows = [row for row in rows if row.date >= last_7_days]

        summary = BjjSessionsSummary(
            total_sessions=len(rows),
            monthly_mat_hours=round(sum(row.duration_minutes for row in last_30_rows) / 60.0, 1),
            weekly_load=sum(row.session_load for row in last_7_rows),
            average_srpe=round(sum(row.srpe for row in rows) / len(rows), 1) if rows else None,
            last_session_at=rows[0].date if rows else None,
        )

        return BjjSessionsOverview(items=items, summary=summary)

    async def get_session(self, user_id: str, session_id: str) -> BjjSessionRead:
        row = await self._get_model(user_id, session_id)
        techniques = await self._load_techniques_by_session_ids([row.id])
        return self._serialize(row, techniques.get(row.id, {}))

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
            round_duration_minutes=payload.round_duration_minutes,
            round_rest_minutes=payload.round_rest_minutes,
            sparring_minutes=payload.sparring_minutes or derive_sparring_minutes(payload.rounds, payload.round_duration_minutes),
            drill_minutes=payload.drill_minutes,
            technique_minutes=payload.technique_minutes,
            trained_positions=payload.trained_positions,
            notes=payload.notes,
            fatigue_before=payload.fatigue_before,
            pain_level=payload.pain_level,
            injury_notes=payload.injury_notes,
            session_score=payload.session_score,
        )
        self.session.add(session)
        await self.session.flush()
        await self._sync_techniques(
            session.id,
            payload.user_id,
            payload.trained_techniques,
            payload.successful_techniques,
            payload.suffered_techniques,
        )
        await self.metrics_service.refresh_daily_rollup(payload.user_id, day)
        await self.session.commit()
        techniques = await self._load_techniques_by_session_ids([session.id])
        return self._serialize(session, techniques.get(session.id, {}))

    async def update_session(self, payload: BjjSessionUpdate, session_id: str) -> BjjSessionRead:
        row = await self._get_model(payload.user_id, session_id)
        current_techniques = await self._load_techniques_by_session_ids([row.id])
        current_groups = current_techniques.get(row.id, {})

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
        if payload.rounds is not None:
            row.rounds = payload.rounds
        if payload.round_duration_minutes is not None:
            row.round_duration_minutes = payload.round_duration_minutes
        if payload.round_rest_minutes is not None:
            row.round_rest_minutes = payload.round_rest_minutes
        if payload.drill_minutes is not None:
            row.drill_minutes = payload.drill_minutes
        if payload.technique_minutes is not None:
            row.technique_minutes = payload.technique_minutes
        if payload.trained_positions is not None:
            row.trained_positions = payload.trained_positions
        if payload.notes is not None:
            row.notes = payload.notes
        if payload.fatigue_before is not None:
            row.fatigue_before = payload.fatigue_before
        if payload.pain_level is not None:
            row.pain_level = payload.pain_level
        if payload.injury_notes is not None:
            row.injury_notes = payload.injury_notes
        if payload.session_score is not None:
            row.session_score = payload.session_score
        row.session_load = calculate_session_load(row.duration_minutes, row.srpe)
        row.sparring_minutes = (
            payload.sparring_minutes
            if payload.sparring_minutes is not None
            else derive_sparring_minutes(row.rounds, row.round_duration_minutes)
        )

        await self._sync_techniques(
            row.id,
            payload.user_id,
            payload.trained_techniques if payload.trained_techniques is not None else current_groups.get("trained", []),
            payload.successful_techniques if payload.successful_techniques is not None else current_groups.get("successful", []),
            payload.suffered_techniques if payload.suffered_techniques is not None else current_groups.get("suffered", []),
        )
        await self.metrics_service.refresh_daily_rollup(payload.user_id, row.date)
        await self.session.commit()
        techniques = await self._load_techniques_by_session_ids([row.id])
        return self._serialize(row, techniques.get(row.id, {}))

    async def delete_session(self, user_id: str, session_id: str) -> None:
        row = await self._get_model(user_id, session_id)
        day = row.date
        await self.session.delete(row)
        await self.session.flush()
        await self.metrics_service.refresh_daily_rollup(user_id, day)
        await self.session.commit()

    async def _get_model(self, user_id: str, session_id: str) -> BjjSession:
        query = select(BjjSession).where(and_(BjjSession.user_id == user_id, BjjSession.id == session_id))
        row = (await self.session.execute(query)).scalar_one_or_none()
        if not row:
            raise NotFoundError("BJJ_SESSION_NOT_FOUND", "BJJ session was not found")
        return row

    async def _load_techniques_by_session_ids(self, session_ids: list[str]) -> dict[str, dict[str, list[str]]]:
        if not session_ids:
            return {}

        query = (
            select(BjjSessionTechnique.session_id, BjjSessionTechnique.type, BjjTechnique.name)
            .join(BjjTechnique, BjjTechnique.id == BjjSessionTechnique.technique_id)
            .where(BjjSessionTechnique.session_id.in_(session_ids))
        )
        rows = (await self.session.execute(query)).all()
        grouped: dict[str, dict[str, list[str]]] = defaultdict(lambda: {"trained": [], "successful": [], "suffered": []})
        for session_id, technique_type, technique_name in rows:
            grouped[session_id][str(technique_type)].append(technique_name)
        return grouped

    async def _sync_techniques(
        self,
        session_id: str,
        user_id: str,
        trained: list[str],
        successful: list[str],
        suffered: list[str],
    ) -> None:
        await self.session.execute(delete(BjjSessionTechnique).where(BjjSessionTechnique.session_id == session_id))
        await self.session.flush()

        for technique_type, technique_names in (
            ("trained", trained),
            ("successful", successful),
            ("suffered", suffered),
        ):
            for technique_name in technique_names:
                technique = await self._find_or_create_technique(user_id, technique_name)
                self.session.add(
                    BjjSessionTechnique(
                        session_id=session_id,
                        technique_id=technique.id,
                        type=technique_type,
                    )
                )

    async def _find_or_create_technique(self, user_id: str, name: str) -> BjjTechnique:
        normalized_name = name.strip()
        query = select(BjjTechnique).where(
            BjjTechnique.created_by_user == user_id,
            func.lower(BjjTechnique.name) == normalized_name.lower(),
        )
        technique = (await self.session.execute(query)).scalar_one_or_none()
        if technique:
            return technique

        technique = BjjTechnique(
            name=normalized_name,
            category="custom",
            position=None,
            gi_mode="both",
            created_by_user=user_id,
            active=True,
        )
        self.session.add(technique)
        await self.session.flush()
        return technique

    def _serialize(self, row: BjjSession, techniques: dict[str, list[str]]) -> BjjSessionRead:
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
            round_duration_minutes=row.round_duration_minutes,
            round_rest_minutes=row.round_rest_minutes,
            sparring_minutes=row.sparring_minutes,
            drill_minutes=row.drill_minutes,
            technique_minutes=row.technique_minutes,
            trained_positions=row.trained_positions or [],
            trained_techniques=techniques.get("trained", []),
            successful_techniques=techniques.get("successful", []),
            suffered_techniques=techniques.get("suffered", []),
            notes=row.notes,
            fatigue_before=row.fatigue_before,
            pain_level=row.pain_level,
            injury_notes=row.injury_notes,
            session_score=row.session_score,
            session_load=row.session_load,
            created_at=row.created_at,
            updated_at=row.updated_at,
        )
