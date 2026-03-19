#!/usr/bin/env sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname "$0")/../.." && pwd)
DEPLOY_ENV_FILE="$ROOT_DIR/.deploy.env"

CANDIDATE_PORTS=${CANDIDATE_PORTS:-"3010 3080 3200 3781 4300 5300"}

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

echo "Ports currently in use on host:"
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

SELECTED_PORT=""
for port in $CANDIDATE_PORTS; do
  if ! is_used "$port"; then
    SELECTED_PORT="$port"
    break
  fi
done

if [ -z "$SELECTED_PORT" ]; then
  port=3001
  while [ "$port" -le 3999 ]; do
    if ! is_used "$port"; then
      SELECTED_PORT="$port"
      break
    fi
    port=$((port + 1))
  done
fi

if [ -z "$SELECTED_PORT" ]; then
  echo "Failed to find a free host port." >&2
  exit 1
fi

cat >"$DEPLOY_ENV_FILE" <<EOF
APP_HOST_PORT=$SELECTED_PORT
APP_INTERNAL_PORT=${APP_INTERNAL_PORT:-3000}
EOF

echo
echo "Selected APP_HOST_PORT=$SELECTED_PORT"
echo "Wrote $DEPLOY_ENV_FILE"
