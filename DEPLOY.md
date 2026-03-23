# Deploy

## Stack de producao

O deploy usa tres servicos:

- `app`: Next.js como camada de interface
- `backend`: FastAPI como unica API
- `db`: PostgreSQL

Nao ha Prisma nem logica de dominio concorrente no Next. O `app` expõe apenas um BFF fino em `/bff` para encaminhar chamadas ao FastAPI no mesmo dominio da interface.

## Dokploy

No Dokploy, use o `docker-compose.yml` raiz sem override local. Ele nao publica `8000:8000` nem `3000:3000` no host, evitando conflito com outras apps no mesmo servidor.

Configure os domains/ports no painel do Dokploy assim:

- `app` na porta interna `3000`
- `backend` na porta interna `8000` se voce quiser expor a API publicamente

Para o frontend funcionar no browser, basta expor o `app`. O browser vai usar o BFF same-origin em `/bff`, e o SSR continua usando `APP_API_BASE_URL_SERVER=http://backend:8000`. Expor o `backend` publicamente passa a ser opcional para webhook direto, health externo ou acesso administrativo.

## Variaveis

Defina estas variaveis no ambiente de deploy:

- `APP_INTERNAL_PORT`: porta interna do frontend, normalmente `3000`
- `NEXT_PUBLIC_API_BASE_URL`: opcional; fallback de compatibilidade para desenvolvimento/debug fora do BFF
- `APP_API_BASE_URL_SERVER`: URL interna usada pelo SSR do Next, normalmente `http://backend:8000`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `BACKEND_DATABASE_URL`: opcional no compose; quando vazio, o backend usa `db` como host do Postgres dentro da rede Docker
- `API_V1_PREFIX`: manter em `/api`
- `CORS_ORIGINS`: origem do frontend, por exemplo `http://127.0.0.1:3020`
- `HEVY_API_BASE_URL`
- `HEVY_API_KEY`
- `HEVY_SYNC_PAGE_SIZE`
- `HEALTH_AUTO_EXPORT_SECRET`
- `LOG_LEVEL`

## Ambiente local

Use os scripts incluidos no repositorio:

```bash
./scripts/deploy/select_port.sh
./scripts/deploy/up.sh
```

O primeiro script escreve `.deploy.env` com as portas locais selecionadas. O segundo sobe a stack com `docker compose` usando `.env` e `.deploy.env`.

## Observacoes

- O backend expoe `GET /api/health` como health principal.
- O browser fala com o `app` no mesmo dominio via `/bff`, e o `app` encaminha as chamadas para a API Python usando `APP_API_BASE_URL_SERVER`.
- Se voce hospedar `backend` em dominio separado para webhook ou acesso externo, ajuste `CORS_ORIGINS` conforme esse dominio e o dominio do frontend.
