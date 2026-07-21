#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"
command -v docker >/dev/null 2>&1 || { echo "Docker with Compose is required for the one-command start."; exit 1; }
command -v node >/dev/null 2>&1 || { echo "Node.js is required to generate the environment file."; exit 1; }
[ -f .env ] || npm run setup -- --docker=1
docker compose up -d --build
docker compose ps
printf '\nLanding page: http://localhost:3000/\nBackoffice:    http://localhost:3000/admin\n'
