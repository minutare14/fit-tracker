from __future__ import annotations

from typing import Any

import httpx

from app.core.config import settings


class HevyClient:
    def __init__(self, api_key: str) -> None:
        self.api_key = api_key
        self.base_url = settings.hevy_api_base_url.rstrip("/")

    @property
    def headers(self) -> dict[str, str]:
        return {"api-key": self.api_key, "accept": "application/json"}

    async def validate_connection(self) -> bool:
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                response = await client.get(
                    f"{self.base_url}/workouts",
                    headers=self.headers,
                    params={"page": 1, "pageSize": 1},
                )
                response.raise_for_status()
                return True
        except httpx.HTTPError:
            return False

    async def get_exercise_templates(self, page: int = 1, page_size: int | None = None) -> list[dict[str, Any]]:
        page_size = page_size or settings.hevy_sync_page_size
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.get(
                f"{self.base_url}/exercise_templates",
                headers=self.headers,
                params={"page": page, "pageSize": page_size},
            )
            response.raise_for_status()
            return response.json().get("exercise_templates", [])

    async def get_workouts(self, page: int = 1, page_size: int | None = None) -> list[dict[str, Any]]:
        page_size = page_size or settings.hevy_sync_page_size
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.get(
                f"{self.base_url}/workouts",
                headers=self.headers,
                params={"page": page, "pageSize": page_size},
            )
            response.raise_for_status()
            return response.json().get("workouts", [])
