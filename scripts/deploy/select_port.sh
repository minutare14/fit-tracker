#!/usr/bin/env sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname "$0")/../.." && pwd)
DEPLOY_ENV_FILE="$ROOT_DIR/.deploy.env"

APP_CANDIDATE_PORTS=${APP_CANDIDATE_PORTS:-"3010 3080 3200 3781 4300 5300"}
BACKEND_CANDIDATE_PORTS=${BACKEND_CANDIDATE_PORTS:-"8000 8100 8200 8300 8400 8500"}

collect_used_ports() {
  if command -v ss >/dev/null 2>&1; then
    ss -tulpnH 2>/dev/null | awk '{print $5}' | sed -E 's/.*:([0-9]+)$/\1/' | sort -n | uniq
    return
  fi

  if command -v netstat >/dev/null 2>&1; then
    netstat -tulpn 2>/dev/null | awk 'NR>2 {print $4}' | sed -E 's/.*:([0-9]+)$/\1/' | sort -n | uniq
    return
  fi

  if command -v lsof >/dev/null 2>&1; then
    lsof -i -P -n 2>/dev/null | awk 'NR>1 {print $9}' | sed -E 's/.*:([0-9]+)(->.*)?$/\1/' | sort -n | uniq
    return
  fi

  echo "No supported port-audit tool found (expected ss, netstat, or lsof)." >&2
  exit 1
}

USED_PORTS=$(collect_used_ports)

echo "Ports currently in use on host (local override):"
echo "$USED_PORTS"

if command -v docker >/dev/null 2>&1; then
  echo
  echo "Docker published ports:"
  docker ps --format 'table {{.Names}}\t{{.Ports}}' 2>/dev/null || true
fi

is_used() {
  port="$1"
  echo "$USED_PORTS" | tr ' ' '\n' | grep -qx "$port"
}

select_free_port() {
  candidate_ports="$1"
  fallback_start="$2"
  fallback_end="$3"

  selected_port=""
  for port in $candidate_ports; do
    if ! is_used "$port"; then
      selected_port="$port"
      break
    fi
  done

  if [ -z "$selected_port" ]; then
    port="$fallback_start"
    while [ "$port" -le "$fallback_end" ]; do
      if ! is_used "$port"; then
        selected_port="$port"
        break
      fi
      port=$((port + 1))
    done
  fi

  printf '%s' "$selected_port"
}

SELECTED_APP_PORT=$(select_free_port "$APP_CANDIDATE_PORTS" 3001 3999)
SELECTED_BACKEND_PORT=$(select_free_port "$BACKEND_CANDIDATE_PORTS" 8001 8999)

if [ -z "$SELECTED_APP_PORT" ] || [ -z "$SELECTED_BACKEND_PORT" ]; then
  echo "Failed to find free ports for app/backend." >&2
  exit 1
fi

cat >"$DEPLOY_ENV_FILE" <<EOF
APP_HOST_PORT=$SELECTED_APP_PORT
BACKEND_HOST_PORT=$SELECTED_BACKEND_PORT
APP_INTERNAL_PORT=${APP_INTERNAL_PORT:-3000}
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:$SELECTED_BACKEND_PORT
CORS_ORIGINS=http://127.0.0.1:$SELECTED_APP_PORT,http://localhost:$SELECTED_APP_PORT
EOF

echo
echo "Selected APP_HOST_PORT=$SELECTED_APP_PORT"
echo "Selected BACKEND_HOST_PORT=$SELECTED_BACKEND_PORT"
echo "Wrote $DEPLOY_ENV_FILE"
