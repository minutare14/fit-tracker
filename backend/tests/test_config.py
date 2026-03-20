from app.core.config import Settings


def test_database_urls_strip_schema_query_param_and_align_drivers() -> None:
    settings = Settings(
        DATABASE_URL="postgresql://postgres:postgres@db:5432/fit_tracker?schema=public",
        DATABASE_URL_SYNC="",
    )

    assert settings.database_url == "postgresql+asyncpg://postgres:postgres@db:5432/fit_tracker"
    assert settings.database_url_sync == "postgresql+psycopg://postgres:postgres@db:5432/fit_tracker"
