## Fit Tracker

Frontend em Next.js/TypeScript com backend principal em Python/FastAPI.

## Stack oficial

- frontend: Next.js + React + TypeScript
- backend: FastAPI + Pydantic + SQLAlchemy + Alembic
- banco: PostgreSQL
- jobs/syncs: worker Python em `backend/app/workers`

As regras de negócio, integrações, webhooks, syncs, persistência e métricas analíticas ficam no backend Python. O frontend consome a API em `/api/...` usando `NEXT_PUBLIC_API_BASE_URL`.

## Desenvolvimento

Frontend:

```bash
npx prisma generate
npm run dev
```

Backend:

```bash
cd backend
pip install -e .[dev]
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

Abra o frontend em [http://localhost:3000](http://localhost:3000).

## Variáveis importantes

- `NEXT_PUBLIC_API_BASE_URL`: base pública da API FastAPI, por exemplo `http://localhost:8000`
- `DATABASE_URL`: conexão assíncrona do backend Python
- `DATABASE_URL_SYNC`: conexão síncrona usada por Alembic
- `HEVY_API_KEY`: fallback opcional apenas para desenvolvimento
- `HEALTH_AUTO_EXPORT_SECRET`: fallback opcional para webhook

## Fluxos principais ligados ao backend Python

- `GET/PUT /api/settings/profile`
- `GET /api/settings/integrations`
- `PUT /api/settings/integrations/hevy`
- `POST /api/settings/integrations/hevy/test`
- `POST /api/settings/integrations/hevy/sync`
- `PUT /api/settings/integrations/autoexport`
- `PUT /api/settings/integrations/ai`
- `GET/POST/PUT/DELETE /api/bjj-sessions`
- `GET /api/dashboard/overview`
- `GET /api/recovery/overview`
- `GET /api/insights/overview`
- `POST /api/webhooks/health/autoexport`

## Nota sobre rotas Next legadas

Ainda existem rotas Next antigas fora do fluxo principal. Elas não são mais a fonte oficial de backend e devem ser tratadas como compatibilidade temporária enquanto a migração total para FastAPI é concluída.

## Deploy sem colisão de porta

The app no longer assumes host port `3000` is free.
The main [docker-compose.yml](/Users/emano/OneDrive/Documentos/Downloads/fit-tracker/docker-compose.yml) stays at the repository root so it can be reached directly during operations and deploys.

1. Audit the host and choose a free port automatically:

```bash
./scripts/deploy/select_port.sh
```

2. Build and start the stack with the selected port:

```bash
./scripts/deploy/up.sh
```

The script inspects the real host with `ss`, `netstat`, or `lsof`, writes `.deploy.env`, and starts Docker Compose with a free `APP_HOST_PORT`.

On the current VPS audited for this project, `3000` and `3010` are already occupied by other workloads, so use an explicitly verified free port such as `3020` only after checking the host.

Useful commands:

```bash
docker compose --env-file .env --env-file .deploy.env ps
docker compose --env-file .env --env-file .deploy.env logs -f app
curl http://127.0.0.1:$(grep APP_HOST_PORT .deploy.env | cut -d= -f2)
```
