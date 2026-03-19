## Fit Tracker

Aplicação Next.js para acompanhamento de treinos, recuperação, nutrição e integrações com Hevy e Health Auto Export.

## Desenvolvimento

Suba o app local:

```bash
npx prisma generate
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Banco e migrations

O projeto usa Prisma com migrations em [prisma/migrations](/Users/emano/OneDrive/Documentos/Downloads/fit-tracker/prisma/migrations).

```bash
npx prisma migrate deploy
npx prisma generate
```

## Variáveis importantes

- `DATABASE_URL`: conexão do Prisma
- `APP_SECRET`: chave usada para criptografar segredos de integrações no backend
- `HEVY_API_KEY`: fallback opcional para sync do Hevy
- `NEXT_PUBLIC_API_URL`: base pública da aplicação
- `APP_HOST_PORT` / `APP_INTERNAL_PORT`: portas do deploy

## Fluxos reais já ligados

- perfil editável via `/api/profile`
- segredo do Hevy salvo no backend e mascarado no frontend
- webhook Health Auto Export em `/api/webhooks/health/autoexport`
- dashboard/settings/health com loading, empty, error e success state

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
