#!/usr/bin/env sh
set -eu

if command -v ss >/dev/null 2>&1; then
  ss -tulpn
  exit 0
fi

if command -v netstat >/dev/null 2>&1; then
  netstat -tulpn
  exit 0
fi

if command -v lsof >/dev/null 2>&1; then
  lsof -i -P -n
  exit 0
fi

echo "No supported audit command found. Install ss, netstat, or lsof." >&2
exit 1
