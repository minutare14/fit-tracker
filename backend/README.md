# Fit Tracker Backend

Backend principal em Python para integrações, ingestão, persistência, métricas derivadas e APIs consumidas pelo frontend Next.js.

## Stack

- FastAPI para API HTTP
- Pydantic para validação e contratos
- SQLAlchemy 2.0 para ORM
- Alembic para migrations
- PostgreSQL como banco principal
- `httpx` para integrações externas
- logging estruturado com request id
- worker Python em `app/workers`

## Estrutura

```text
backend/
  app/
    api/
      routes/
    core/
    db/
    integrations/
    metrics/
    models/
    repositories/
    schemas/
    services/
    workers/
  migrations/
  tests/
```

## Subir localmente

```bash
pip install -e .[dev]
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

## Endpoints principais

- `GET /api/health`
- `GET /api/health/db`
- `GET /api/settings/profile`
- `PUT /api/settings/profile`
- `GET /api/settings/integrations`
- `PUT /api/settings/integrations/hevy`
- `POST /api/settings/integrations/hevy/test`
- `POST /api/settings/integrations/hevy/sync`
- `PUT /api/settings/integrations/autoexport`
- `PUT /api/settings/integrations/ai`
- `GET /api/dashboard/overview`
- `GET /api/recovery/overview`
- `GET /api/insights/overview`
- `GET /api/bjj-sessions`
- `POST /api/bjj-sessions`
- `GET /api/bjj-sessions/{id}`
- `PUT /api/bjj-sessions/{id}`
- `DELETE /api/bjj-sessions/{id}`
- `POST /api/webhooks/health/autoexport`

## Domínio suportado

- `users`
- `user_profiles`
- `integration_connections`
- `integration_secrets`
- `sync_runs`
- `raw_events`
- `hevy_workouts`, `hevy_workout_exercises`, `hevy_sets`
- `bjj_sessions`
- `health_metrics`
- `nutrition_daily`
- `weight_entries`
- `readiness_snapshots`
- `derived_metrics`

## Jobs Python

`app/workers/tasks.py` concentra rotinas assíncronas para:

- backfill do Hevy
- sync incremental do Hevy
- ingestão do Auto Export
- recálculo de métricas derivadas

## Contrato de erro

Todas as falhas relevantes retornam envelope padronizado:

```json
{
  "error": {
    "code": "INTEGRATION_NOT_CONFIGURED",
    "message": "Hevy integration is not configured",
    "details": null
  }
}
```
