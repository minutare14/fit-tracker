from datetime import datetime

from pydantic import Field

from app.schemas.common import APIModel


class IntegrationLogRead(APIModel):
    id: str
    provider: str
    status: str
    started_at: datetime
    finished_at: datetime | None = None
    records_processed: int
    error_message: str | None = None


class HevySettingsRead(APIModel):
    configured: bool
    status: str
    last_sync_at: datetime | None = None
    has_valid_api_key: bool
    sync_in_progress: bool
    workouts_imported: int
    masked_api_key: str | None = None
    last_error: str | None = None


class HealthAutoExportSettingsRead(APIModel):
    configured: bool
    status: str
    last_payload_at: datetime | None = None
    has_secret: bool
    webhook_url: str
    header_name: str
    secret_mask: str | None = None
    last_error: str | None = None


class AISettingsRead(APIModel):
    configured: bool
    provider: str
    model: str


class SettingsIntegrationsRead(APIModel):
    hevy: HevySettingsRead
    health_auto_export: HealthAutoExportSettingsRead
    ai: AISettingsRead
    sync_history: list[IntegrationLogRead]


class HevySettingsWrite(APIModel):
    user_id: str = Field(default="default-user")
    api_key: str


class HevyTestRequest(APIModel):
    user_id: str = Field(default="default-user")
    api_key: str | None = None


class HevySyncRequest(APIModel):
    user_id: str = Field(default="default-user")
    mode: str = "delta"


class AutoExportSettingsWrite(APIModel):
    user_id: str = Field(default="default-user")
    webhook_secret: str
    header_name: str = "x-health-autoexport-secret"


class AISettingsWrite(APIModel):
    user_id: str = Field(default="default-user")
    provider: str = "openai"
    model: str = "gpt-4.1-mini"
