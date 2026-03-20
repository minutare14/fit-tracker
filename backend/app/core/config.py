import base64
import json
from functools import lru_cache
from typing import Annotated
from urllib.parse import parse_qs, parse_qsl, urlencode, urlparse, urlunparse

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = Field(default="Fit Tracker Backend", alias="APP_NAME")
    app_env: str = Field(default="development", alias="APP_ENV")
    app_port: int = Field(default=8000, alias="APP_PORT")
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")
    api_v1_prefix: str = Field(default="/api", alias="API_V1_PREFIX")
    cors_origins: Annotated[list[str], NoDecode] = Field(
        default_factory=lambda: [
            "http://localhost:3000",
            "https://fit.minutarecore.space",
            "https://api.fit.minutarecore.space",
        ],
        alias="CORS_ORIGINS",
    )

    database_url: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/fit_tracker",
        alias="DATABASE_URL",
    )
    database_url_sync: str | None = Field(
        default=None,
        alias="DATABASE_URL_SYNC",
    )

    hevy_api_base_url: str = Field(default="https://api.hevyapp.com/v1", alias="HEVY_API_BASE_URL")
    hevy_api_key: str | None = Field(default=None, alias="HEVY_API_KEY")
    hevy_sync_page_size: int = Field(default=20, alias="HEVY_SYNC_PAGE_SIZE")

    health_auto_export_secret: str | None = Field(default=None, alias="HEALTH_AUTO_EXPORT_SECRET")

    enable_scheduler: bool = Field(default=False, alias="ENABLE_SCHEDULER")
    scheduler_timezone: str = Field(default="America/Bahia", alias="SCHEDULER_TIMEZONE")

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value):
        if isinstance(value, str):
            normalized_value = value.strip()
            if normalized_value.startswith("["):
                parsed_value = json.loads(normalized_value)
                if isinstance(parsed_value, list):
                    return [str(origin).strip() for origin in parsed_value if str(origin).strip()]
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    @field_validator("database_url", "database_url_sync", mode="before")
    @classmethod
    def normalize_database_url(cls, value: str | None) -> str | None:
        if value is None:
            return value
        if not isinstance(value, str):
            return value

        normalized_value = value.strip('"')
        if not normalized_value:
            return None

        if normalized_value.startswith("prisma+postgres://"):
            normalized_value = cls._extract_postgres_url_from_prisma(normalized_value)

        return cls._strip_unsupported_postgres_query_params(normalized_value)

    @model_validator(mode="after")
    def align_driver_urls(self):
        if not self.database_url_sync:
            self.database_url_sync = self.database_url
        if self.database_url.startswith("postgres://"):
            self.database_url = self.database_url.replace("postgres://", "postgresql+asyncpg://", 1)
        if self.database_url.startswith("postgresql://"):
            self.database_url = self.database_url.replace("postgresql://", "postgresql+asyncpg://", 1)
        if self.database_url_sync.startswith("postgres://"):
            self.database_url_sync = self.database_url_sync.replace("postgres://", "postgresql+psycopg://", 1)
        if self.database_url_sync.startswith("postgresql://"):
            self.database_url_sync = self.database_url_sync.replace("postgresql://", "postgresql+psycopg://", 1)
        return self

    @staticmethod
    def _extract_postgres_url_from_prisma(prisma_url: str) -> str:
        parsed = urlparse(prisma_url.strip('"'))
        api_key = parse_qs(parsed.query).get("api_key", [None])[0]
        if not api_key:
            raise ValueError("Invalid prisma+postgres URL: missing api_key")

        payload = Settings._decode_prisma_api_key(api_key)
        return payload.get("databaseUrl") or payload.get("shadowDatabaseUrl") or prisma_url

    @staticmethod
    def _decode_prisma_api_key(api_key: str) -> dict:
        token_part = api_key.split(".")[1] if "." in api_key else api_key
        padding = "=" * (-len(token_part) % 4)
        decoded = base64.urlsafe_b64decode(f"{token_part}{padding}")
        return json.loads(decoded.decode("utf-8"))

    @staticmethod
    def _strip_unsupported_postgres_query_params(database_url: str) -> str:
        parsed = urlparse(database_url)
        if not parsed.scheme.startswith("postgres"):
            return database_url

        filtered_query = [
            (key, value)
            for key, value in parse_qsl(parsed.query, keep_blank_values=True)
            if key.lower() != "schema"
        ]
        return urlunparse(parsed._replace(query=urlencode(filtered_query)))


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
