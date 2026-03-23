from app.core.config import Settings


def test_database_urls_strip_schema_query_param_and_align_drivers() -> None:
    settings = Settings(
        DATABASE_URL="postgresql://postgres:postgres@db:5432/fit_tracker?schema=public",
        DATABASE_URL_SYNC="",
    )

    assert settings.database_url == "postgresql+asyncpg://postgres:postgres@db:5432/fit_tracker"
    assert settings.database_url_sync == "postgresql+psycopg://postgres:postgres@db:5432/fit_tracker"


def test_database_url_sync_is_derived_from_async_driver() -> None:
    settings = Settings(
        DATABASE_URL="postgresql+asyncpg://postgres:postgres@db:5432/fit_tracker",
        DATABASE_URL_SYNC="",
    )

    assert settings.database_url == "postgresql+asyncpg://postgres:postgres@db:5432/fit_tracker"
    assert settings.database_url_sync == "postgresql+psycopg://postgres:postgres@db:5432/fit_tracker"


def test_cors_origins_accept_csv_env_string() -> None:
    settings = Settings(CORS_ORIGINS="http://localhost:3000,https://fit.minutarecore.space")

    assert settings.cors_origins == [
        "http://localhost:3000",
        "https://fit.minutarecore.space",
    ]
