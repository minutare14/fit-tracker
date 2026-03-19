# Deploy

## Dokploy Environment

Set these variables in Dokploy before deploying:

- `APP_HOST_PORT`: required host port for the Next.js container
- `APP_INTERNAL_PORT`: container port, usually `3000`
- `DATABASE_URL`: runtime Prisma connection string
- `APP_SECRET`: encryption key for integration secrets stored in the backend
- `HEVY_API_KEY`: runtime Hevy integration key
- `NEXT_PUBLIC_API_URL`: public URL used by the frontend
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`

Recommended runtime values for the current VPS:

```env
APP_HOST_PORT=3020
APP_INTERNAL_PORT=3000
DATABASE_URL=postgresql://postgres:postgres@db:5432/fit_tracker?schema=public
NEXT_PUBLIC_API_URL=http://185.188.249.39:3020
```

## Why `APP_HOST_PORT` is required

This host already has other workloads bound to ports like `3000` and `3010`. The compose file now requires an explicit host port instead of silently defaulting to a potentially occupied one.

## Port Audit

Run one of these on the host before changing the app port:

```bash
ss -tulpn
netstat -tulpn
lsof -i -P -n
```

You can also use the included helper:

```bash
./scripts/deploy/audit_ports.sh
```

## Strategy

- Next.js listens on `APP_INTERNAL_PORT` inside the container.
- Only the app container binds to the host.
- Postgres stays internal to the compose network and is not published on the VPS.
- The app also joins `dokploy-network`, which keeps future migration to Traefik simpler.
