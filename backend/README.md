# Fit Tracker Backend

Backend principal em Python para integrações, ingestão, persistência, métricas derivadas e APIs consumidas pelo frontend Next.js.

## Stack

- FastAPI para APIs HTTP tipadas e assíncronas
- SQLAlchemy 2.0 para ORM e camada de acesso a dados
- Alembic para migrations
- Pydantic Settings para configuração
- `asyncpg` para acesso assíncrono ao PostgreSQL
- `psycopg` para migrations e operações síncronas
- Pandas para agregações e transforms
- APScheduler como base de jobs/syncs

## Estrutura

```text
backend/
  app/
    api/
    core/
    db/
    integrations/
    metrics/
    models/
    repositories/
    schemas/
    services/
    insights/
    workers/
  migrations/
  tests/
```

## Subir localmente

1. Crie um ambiente virtual Python 3.11+.
2. Instale dependências:

```bash
pip install -e .[dev]
```

3. Copie `.env.example` para `.env` e ajuste as credenciais.
4. Rode as migrations:

```bash
alembic upgrade head
```

5. Suba a API:

```bash
uvicorn app.main:app --reload --port 8000
```

## Responsabilidades arquiteturais

### Backend Python

- integrações Hevy e Health Auto Export
- ingestão de payloads raw e normalizados
- syncs, idempotência e logs operacionais
- persistência e enrichments
- fórmulas, métricas derivadas e rollups diários
- APIs preparadas para consumo do frontend

### Frontend Next.js

- páginas, dashboards e UX
- formulários de configuração
- gráficos e visualização
- consumo dos payloads prontos do backend

## Endpoints base já criados

- `GET /api/v1/health`
- `GET /api/v1/health/db`
- `GET /api/v1/hevy/status`
- `POST /api/v1/hevy/connections`
- `POST /api/v1/hevy/sync/exercise-templates`
- `POST /api/v1/hevy/sync/workouts`
- `GET /api/v1/hevy/exercise-templates`
- `GET /api/v1/hevy/workouts`
- `POST /api/v1/webhooks/health-auto-export`
- `GET /api/v1/metrics/daily-rollups`

## Observação de migração

O código atual em `src/app/api`, `src/services`, `src/integrations` e `src/lib/metrics` deve ser progressivamente deslocado para este backend. O Next.js deve ficar apenas como camada web.
