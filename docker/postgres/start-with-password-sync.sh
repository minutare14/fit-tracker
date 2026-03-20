#!/bin/sh
set -eu

postgres_user="${POSTGRES_USER:-postgres}"
postgres_db="${POSTGRES_DB:-postgres}"

run_as_postgres() {
  if command -v gosu >/dev/null 2>&1; then
    gosu postgres "$@"
    return
  fi

  if command -v su-exec >/dev/null 2>&1; then
    su-exec postgres "$@"
    return
  fi

  echo "missing gosu/su-exec helper in postgres image" >&2
  exit 1
}

docker-entrypoint.sh postgres &
pg_pid="$!"

cleanup() {
  if kill -0 "$pg_pid" 2>/dev/null; then
    kill "$pg_pid"
  fi
}

trap cleanup INT TERM

until run_as_postgres pg_isready -h /var/run/postgresql -U "$postgres_user" -d "$postgres_db" >/dev/null 2>&1; do
  sleep 1
done

if [ -n "${POSTGRES_PASSWORD:-}" ]; then
  run_as_postgres psql \
    -v ON_ERROR_STOP=1 \
    --set=role_name="$postgres_user" \
    --set=role_password="$POSTGRES_PASSWORD" \
    -d postgres <<'SQL'
SELECT format('ALTER USER %I WITH PASSWORD %L', :'role_name', :'role_password') \gexec
SQL
fi

wait "$pg_pid"
