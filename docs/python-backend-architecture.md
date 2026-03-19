# Arquitetura Python do Backend

## Diretriz

O BJJ LAB passa a assumir oficialmente:

- frontend em Next.js/TypeScript
- backend principal em Python/FastAPI
- regras de negócio, integrações, webhooks, persistência e métricas derivadas em Python

Rotas Next antigas só devem existir como compatibilidade temporária, nunca como backend principal.

## Camadas

### API

- `backend/app/api/routes/settings.py`
- `backend/app/api/routes/dashboard.py`
- `backend/app/api/routes/recovery.py`
- `backend/app/api/routes/insights.py`
- `backend/app/api/routes/bjj_sessions.py`
- `backend/app/api/routes/webhooks.py`

### Schemas

Os contratos FastAPI usam Pydantic com alias camelCase em `backend/app/schemas/common.py`, para manter compatibilidade natural com o frontend React/TypeScript sem mover a lógica para Node.

### Serviços

- `ProfileService`: leitura e escrita do perfil do atleta
- `SettingsService`: integrações, segredos e configuração de IA
- `HevyService`: validação, sync e persistência granular de treinos Hevy
- `HealthAutoExportService`: ingestão e normalização de payloads do webhook
- `BjjSessionsService`: CRUD de sessões manuais e atualização de métricas derivadas
- `MetricsService`: rollups diários, acute load, chronic load, ACWR e readiness
- `DashboardService`, `RecoveryService`, `InsightsService`: view models estáveis para o frontend

### Persistência

Modelos relevantes no backend Python:

- `users`
- `user_profiles`
- `integration_connections`
- `integration_secrets`
- `sync_runs`
- `raw_events`
- `hevy_workouts`
- `hevy_workout_exercises`
- `hevy_sets`
- `bjj_sessions`
- `health_metrics`
- `nutrition_daily`
- `weight_entries`
- `readiness_snapshots`
- `derived_metrics`

## Fórmulas no backend Python

- `session_load = duration_minutes * srpe`
- acute load: média móvel curta
- chronic load: média móvel longa
- ACWR: razão entre acute e chronic
- readiness: derivada a partir de HRV, sono e sinais disponíveis

Nenhuma dessas regras deve depender do frontend.

## Jobs Python

`backend/app/workers/tasks.py` concentra rotinas reutilizáveis para:

- backfill do Hevy
- sync incremental do Hevy
- ingestão do Auto Export
- reprocessamento de métricas derivadas

Essas rotinas já estão organizadas para rodar em worker Python. Redis pode ser acoplado como fila sem mover a regra de negócio para fora do backend.

## Observabilidade

- request id por request
- logs de início e fim de request com status e duração
- handlers centralizados para `AppError`, `HTTPException` e `RequestValidationError`
- envelope de erro padronizado para o frontend

## Integração com o frontend

O frontend usa `NEXT_PUBLIC_API_BASE_URL` em `src/modules/core/api/http-client.ts` para apontar para o FastAPI. As páginas principais consomem:

- `/api/dashboard/overview`
- `/api/bjj-sessions`
- `/api/recovery/overview`
- `/api/settings/profile`
- `/api/settings/integrations`
- `/api/insights/overview`

Isso preserva o frontend em TypeScript sem manter a lógica principal do backend dentro do Next.
