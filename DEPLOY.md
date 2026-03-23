# Deploy

## Stack de producao

O deploy usa tres servicos:

- `app`: Next.js como camada de interface
- `backend`: FastAPI como unica API
- `db`: PostgreSQL

Nao ha rewrite interno do Next, nem rotas API concorrentes, nem Prisma no caminho oficial.

## Dokploy

No Dokploy, use o `docker-compose.yml` raiz sem override local. Ele nao publica `8000:8000` nem `3000:3000` no host, evitando conflito com outras apps no mesmo servidor.

Configure os domains/ports no painel do Dokploy assim:

- `app` na porta interna `3000`
- `backend` na porta interna `8000` se voce quiser expor a API publicamente

Para o frontend funcionar no browser, defina `NEXT_PUBLIC_API_BASE_URL` com a URL publica real do backend, por exemplo `https://api.seudominio.com`. O SSR continua usando `APP_API_BASE_URL_SERVER=http://backend:8000`.

## Variaveis

Defina estas variaveis no ambiente de deploy:

- `APP_INTERNAL_PORT`: porta interna do frontend, normalmente `3000`
- `NEXT_PUBLIC_API_BASE_URL`: URL publica da API, por exemplo `http://127.0.0.1:8000` em ambiente local ou a URL publica do backend em producao
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

O primeiro script escreve `.deploy.env` com as portas selecionadas e com a URL publica da API Python. O segundo sobe a stack com `docker compose` usando `.env` e `.deploy.env`.

## Observacoes

- O backend expoe `GET /api/health` como health principal.
- O frontend faz chamadas diretas para a API Python usando `NEXT_PUBLIC_API_BASE_URL` no browser e `APP_API_BASE_URL_SERVER` no SSR.
- Se voce hospedar `app` e `backend` em dominios separados, configure o `NEXT_PUBLIC_API_BASE_URL` para o dominio publico do backend e ajuste `CORS_ORIGINS` para o dominio do frontend.
