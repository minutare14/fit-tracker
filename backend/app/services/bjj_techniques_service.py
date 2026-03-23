from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.performance import BjjTechnique
from app.repositories.integration_repository import IntegrationRepository
from app.schemas.bjj_sessions import BjjTechniqueCreate, BjjTechniqueRead


class BjjTechniquesService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.integration_repository = IntegrationRepository(session)

    async def list_techniques(self, user_id: str) -> list[BjjTechniqueRead]:
        await self.integration_repository.ensure_user(user_id)
        query = (
            select(BjjTechnique)
            .where(
                BjjTechnique.created_by_user == user_id,
                BjjTechnique.active.is_(True),
            )
            .order_by(BjjTechnique.name.asc())
        )
        rows = list((await self.session.execute(query)).scalars().all())
        return [self._serialize(row) for row in rows]

    async def create_technique(self, user_id: str, payload: BjjTechniqueCreate) -> BjjTechniqueRead:
        await self.integration_repository.ensure_user(user_id)
        
        query = select(BjjTechnique).where(
            BjjTechnique.created_by_user == user_id,
            func.lower(BjjTechnique.name) == payload.name.strip().lower(),
        )
        existing = (await self.session.execute(query)).scalar_one_or_none()
        if existing:
            return self._serialize(existing)
            
        technique = BjjTechnique(
            name=payload.name,
            category=payload.category,
            position=payload.position,
            gi_mode=payload.gi_mode,
            created_by_user=user_id,
            active=True
        )
        self.session.add(technique)
        await self.session.flush()
        await self.session.commit()
        return self._serialize(technique)

    def _serialize(self, row: BjjTechnique) -> BjjTechniqueRead:
        return BjjTechniqueRead(
            id=row.id,
            name=row.name,
            category=row.category,
            position=row.position,
            gi_mode=row.gi_mode,
            active=row.active,
            created_at=row.created_at,
        )
