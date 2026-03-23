#!/usr/bin/env sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname "$0")/../.." && pwd)
cd "$ROOT_DIR"

if [ ! -f ".env" ]; then
  echo ".env file not found. Copy .env.example first." >&2
  exit 1
fi

if [ ! -f ".deploy.env" ]; then
  "$ROOT_DIR/scripts/deploy/select_port.sh"
fi

echo "Using deploy variables:"
cat .deploy.env

docker compose \
  -f docker-compose.yml \
  -f docker-compose.local.yml \
  --env-file .env \
  --env-file .deploy.env \
  up -d --build
docker compose \
  -f docker-compose.yml \
  -f docker-compose.local.yml \
  --env-file .env \
  --env-file .deploy.env \
  ps

APP_HOST_PORT=$(grep '^APP_HOST_PORT=' .deploy.env | cut -d= -f2)
BACKEND_HOST_PORT=$(grep '^BACKEND_HOST_PORT=' .deploy.env | cut -d= -f2)
echo
echo "App expected at: http://127.0.0.1:${APP_HOST_PORT}"
echo "Backend expected at: http://127.0.0.1:${BACKEND_HOST_PORT}"
