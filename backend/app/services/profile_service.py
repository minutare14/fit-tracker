from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User, UserProfile
from app.repositories.integration_repository import IntegrationRepository
from app.schemas.profile import ProfileRead, ProfileUpdate, ProfileWriteResult


class ProfileService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.integration_repository = IntegrationRepository(session)

    async def get_profile(self, user_id: str) -> ProfileRead:
        user = await self.integration_repository.ensure_user(user_id)
        profile = await self._get_profile_model(user_id)
        return self._serialize(user, profile)

    async def update_profile(self, payload: ProfileUpdate) -> ProfileWriteResult:
        user = await self.integration_repository.ensure_user(payload.user_id)
        profile = await self._get_profile_model(payload.user_id)

        user.name = payload.name or user.name
        user.belt = payload.belt_rank or user.belt
        user.weight = payload.current_weight_kg
        user.calories_target = payload.daily_calorie_target
        user.protein_target = payload.protein_target_g
        user.carbs_target = payload.carbs_target_g
        user.fat_target = payload.fat_target_g

        if not profile:
            profile = UserProfile(user_id=payload.user_id)
            self.session.add(profile)

        profile.display_name = payload.display_name
        profile.birth_date = payload.birth_date
        profile.sex = payload.sex
        profile.height_cm = payload.height_cm
        profile.current_weight_kg = payload.current_weight_kg
        profile.target_weight_kg = payload.target_weight_kg
        profile.target_category = payload.target_category
        profile.belt_rank = payload.belt_rank
        profile.academy_team = payload.academy_team
        profile.primary_goal = payload.primary_goal
        profile.injuries_restrictions = payload.injuries_restrictions
        profile.timezone = payload.timezone
        profile.unit_system = payload.unit_system
        profile.weight_unit = payload.weight_unit
        profile.hydration_target_liters = payload.hydration_target_liters
        profile.calorie_target = payload.calorie_target or payload.daily_calorie_target
        profile.protein_target_g = payload.protein_target_g
        profile.carbs_target_g = payload.carbs_target_g
        profile.fat_target_g = payload.fat_target_g
        profile.hydration_target_ml = payload.hydration_target_ml

        await self.session.flush()
        await self.session.commit()

        return ProfileWriteResult(success=True, profile=self._serialize(user, profile))

    async def _get_profile_model(self, user_id: str) -> UserProfile | None:
        query = select(UserProfile).where(UserProfile.user_id == user_id)
        return (await self.session.execute(query)).scalar_one_or_none()

    def _serialize(self, user: User, profile: UserProfile | None) -> ProfileRead:
        return ProfileRead(
            user_id=user.id,
            name=user.name or "",
            email=user.email or "",
            display_name=profile.display_name if profile else "",
            birth_date=profile.birth_date if profile and profile.birth_date else None,
            sex=profile.sex if profile and profile.sex else "",
            height_cm=profile.height_cm if profile else None,
            current_weight_kg=profile.current_weight_kg if profile and profile.current_weight_kg is not None else user.weight,
            target_weight_kg=profile.target_weight_kg if profile else None,
            target_category=profile.target_category if profile and profile.target_category else "",
            belt_rank=profile.belt_rank if profile and profile.belt_rank else user.belt or "",
            academy_team=profile.academy_team if profile and profile.academy_team else "",
            primary_goal=profile.primary_goal if profile and profile.primary_goal else "",
            injuries_restrictions=profile.injuries_restrictions if profile and profile.injuries_restrictions else "",
            timezone=profile.timezone if profile and profile.timezone else "America/Bahia",
            unit_system=profile.unit_system if profile and profile.unit_system else "metric",
            weight_unit=profile.weight_unit if profile and profile.weight_unit else "kg",
            daily_calorie_target=user.calories_target,
            calorie_target=profile.calorie_target if profile else user.calories_target,
            protein_target_g=profile.protein_target_g if profile else user.protein_target,
            carbs_target_g=profile.carbs_target_g if profile else user.carbs_target,
            fat_target_g=profile.fat_target_g if profile else user.fat_target,
            hydration_target_liters=profile.hydration_target_liters if profile else None,
            hydration_target_ml=profile.hydration_target_ml if profile else None,
        )
