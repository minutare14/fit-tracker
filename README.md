# Fit Tracker

Aplicacao com frontend em Next.js e backend principal em Python/FastAPI.

## Stack

- `frontend`: Next.js + React + TypeScript
- `backend`: FastAPI + Pydantic + SQLAlchemy + Alembic
- `db`: PostgreSQL

O frontend usa um BFF fino e same-origin em `/bff` apenas como camada de transporte. O browser fala com o `app`, o `app` encaminha para o FastAPI via `APP_API_BASE_URL_SERVER`, e o FastAPI continua como unica fonte de verdade. Nao ha Prisma nem logica de dominio duplicada no Next.

## Desenvolvimento local

1. Copie os exemplos de ambiente:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

2. Inicie o backend:

```bash
cd backend
pip install -e .[dev]
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

3. Inicie o frontend:

```bash
npm install
npm run dev
```

## Health

- `GET /api/health`
- `GET /api/health/db`

## Fluxo principal

- `GET /api/dashboard/overview`
- `GET /api/bjj-sessions`
- `GET /api/recovery/overview`
- `GET /api/weight/overview`
- `GET /api/weight/entries`
- `GET /api/nutrition/overview`
- `GET /api/insights/overview`
- `GET /api/settings/profile`
- `GET /api/settings/integrations`
- `PUT /api/settings/hevy`
- `POST /api/settings/hevy/test`
- `POST /api/settings/hevy/sync`
- `PUT /api/settings/autoexport`
- `PUT /api/settings/ai`
- `POST /api/webhooks/health/autoexport`

## Compose

O `docker-compose.yml` raiz sobe apenas `app`, `backend` e `db` na rede interna do projeto. Isso evita bind fixo de portas no host e funciona melhor em plataformas como Dokploy. O health principal da stack fica no backend em `/api/health`.

Para desenvolvimento local com portas publicadas no host, use o override `docker-compose.local.yml` via scripts:

```bash
./scripts/deploy/select_port.sh
./scripts/deploy/up.sh
```

O script de portas seleciona `APP_HOST_PORT` e `BACKEND_HOST_PORT`, escreve `.deploy.env` e preenche variaveis locais de compatibilidade. Em runtime, o browser usa `/bff` no mesmo dominio da aplicacao.
