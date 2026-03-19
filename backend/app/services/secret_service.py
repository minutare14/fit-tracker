from __future__ import annotations

import base64
import hashlib

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.integration import IntegrationProvider, IntegrationSecret


def _encode_secret(value: str) -> str:
    return base64.urlsafe_b64encode(value.encode("utf-8")).decode("utf-8")


def _decode_secret(value: str) -> str:
    return base64.urlsafe_b64decode(value.encode("utf-8")).decode("utf-8")


def mask_secret(value: str | None) -> str | None:
    if not value:
        return None
    return f"****{value[-4:]}"


class SecretService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_secret(
        self,
        user_id: str,
        provider: IntegrationProvider,
        key: str,
    ) -> str | None:
        query = select(IntegrationSecret).where(
            IntegrationSecret.user_id == user_id,
            IntegrationSecret.provider == provider,
            IntegrationSecret.key == key,
        )
        secret = (await self.session.execute(query)).scalar_one_or_none()
        if not secret:
            return None
        return _decode_secret(secret.encrypted_value)

    async def get_masked_secret(
        self,
        user_id: str,
        provider: IntegrationProvider,
        key: str,
    ) -> str | None:
        query = select(IntegrationSecret).where(
            IntegrationSecret.user_id == user_id,
            IntegrationSecret.provider == provider,
            IntegrationSecret.key == key,
        )
        secret = (await self.session.execute(query)).scalar_one_or_none()
        return mask_secret(secret.last4) if secret and secret.last4 else None

    async def save_secret(
        self,
        user_id: str,
        provider: IntegrationProvider,
        key: str,
        value: str,
        metadata_json: dict | None = None,
    ) -> IntegrationSecret:
        query = select(IntegrationSecret).where(
            IntegrationSecret.user_id == user_id,
            IntegrationSecret.provider == provider,
            IntegrationSecret.key == key,
        )
        secret = (await self.session.execute(query)).scalar_one_or_none()
        if not secret:
            secret = IntegrationSecret(
                user_id=user_id,
                provider=provider,
                key=key,
                encrypted_value=_encode_secret(value),
                value_hash=hashlib.sha256(value.encode("utf-8")).hexdigest(),
                last4=value[-4:],
                metadata_json=metadata_json,
            )
            self.session.add(secret)
            await self.session.flush()
            return secret

        secret.encrypted_value = _encode_secret(value)
        secret.value_hash = hashlib.sha256(value.encode("utf-8")).hexdigest()
        secret.last4 = value[-4:]
        secret.metadata_json = metadata_json
        await self.session.flush()
        return secret
