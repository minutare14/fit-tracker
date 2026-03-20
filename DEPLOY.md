# Deploy

## Dokploy Environment

Set these variables in Dokploy before deploying:

- `APP_HOST_PORT`: required host port for the Next.js container
- `APP_INTERNAL_PORT`: container port, usually `3000`
- `DATABASE_URL`: optional explicit database URL shared by Prisma and FastAPI
- `DATABASE_URL_SYNC`: optional sync SQLAlchemy URL for the FastAPI backend; when omitted it is derived from `DATABASE_URL`
- `APP_SECRET`: encryption key for integration secrets stored in the backend
- `HEVY_API_KEY`: runtime Hevy integration key
- `NEXT_PUBLIC_API_BASE_URL`: optional public API URL used by browser-side calls
- `API_PROXY_TARGET`: internal target used by Next.js to proxy `/api/*` requests, recommended `http://backend:8000`
- `API_V1_PREFIX`: keep this as `/api`
- `CORS_ORIGINS`: comma-separated allowed origins for FastAPI
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`

Recommended runtime values for the current VPS:

```env
APP_HOST_PORT=3020
APP_INTERNAL_PORT=3000
POSTGRES_USER=postgres
POSTGRES_PASSWORD=fittracker
POSTGRES_DB=fit_tracker
DATABASE_URL=
DATABASE_URL_SYNC=
NEXT_PUBLIC_API_BASE_URL=https://api.fit.minutarecore.space
API_PROXY_TARGET=http://backend:8000
API_V1_PREFIX=/api
CORS_ORIGINS=https://fit.minutarecore.space,https://api.fit.minutarecore.space
```

## Important: Persistent Postgres Passwords

- If `postgres_data` already exists, changing `POSTGRES_PASSWORD` later does not rotate the password stored inside the database cluster.
- The backend healthcheck temporarily uses `/api/health` during a clean rebuild so the app only depends on the API process becoming reachable while migrations settle.
- To avoid drift, the compose file now derives backend DB URLs from `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_DB` when `DATABASE_URL` is left empty.
- The Postgres service now builds a small wrapper image that starts the official `postgres:16-alpine` entrypoint and synchronizes the application user's password with the current `POSTGRES_PASSWORD` on startup, including when the volume already exists.
- Leave `DATABASE_URL` and `DATABASE_URL_SYNC` empty in Dokploy unless you intentionally need an explicit override.

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
- The DB healthcheck now validates authenticated access with the configured password, so `backend` only starts after the credential that `/api/health/db` needs is actually usable.
- The backend container now runs `alembic upgrade head` before starting `uvicorn`, so a fresh or reset database gets its schema before the API begins serving requests.
- The app and backend also join `dokploy-network`.
- The frontend now proxies same-origin `/api/*` requests to `API_PROXY_TARGET`, which removes the previous 404s from `https://fit.minutarecore.space/api/*`.
- Dokploy still needs two domain mappings in the panel:
  - `fit.minutarecore.space` -> service `app` on port `3000`
  - `api.fit.minutarecore.space` -> service `backend` on port `8000`
