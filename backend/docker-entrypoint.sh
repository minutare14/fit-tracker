#!/bin/sh
set -eu

max_attempts="${MIGRATION_MAX_ATTEMPTS:-30}"
attempt=1

until python -m alembic upgrade head; do
  if [ "$attempt" -ge "$max_attempts" ]; then
    echo "alembic upgrade head failed after $attempt attempts" >&2
    exit 1
  fi

  echo "migration attempt $attempt/$max_attempts failed; retrying in 2s..." >&2
  attempt=$((attempt + 1))
  sleep 2
done

exec "$@"
