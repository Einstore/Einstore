#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="${ROOT_DIR}/docker-compose.app-platform.yml"
ENV_FILE="${APP_PLATFORM_ENV_FILE:-${ROOT_DIR}/scripts/app-platform.env}"
IMAGE_NAME="${APP_PLATFORM_PACK_IMAGE:-einstore-api-pack}"
BUILDER="${APP_PLATFORM_PACK_BUILDER:-heroku/builder:24}"

if ! command -v pack >/dev/null 2>&1; then
  echo "pack is required but not installed." >&2
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing env file: $ENV_FILE" >&2
  echo "Copy scripts/app-platform.env.example to scripts/app-platform.env and fill it in." >&2
  exit 1
fi

PACK_ENV=(
  --env "BP_NODE_PROJECT_PATH=API"
  --env "BP_NODE_RUN_SCRIPTS=do:build"
  --env "BP_PROCFILE=API/Procfile.app-platform"
  --env "NPM_CONFIG_INSTALL_LINKS=false"
)

if [[ -n "${BILLING_DEPLOY_KEY:-}" ]]; then
  PACK_ENV+=(--env "BILLING_DEPLOY_KEY=${BILLING_DEPLOY_KEY}")
fi

if [[ -n "${PACK_NODE_INSTALL:-}" ]]; then
  PACK_ENV+=(--env "BP_NODE_INSTALL_COMMAND=${PACK_NODE_INSTALL}")
fi

pack build "$IMAGE_NAME" --builder "$BUILDER" --path "$ROOT_DIR" "${PACK_ENV[@]}"

docker compose -f "$COMPOSE_FILE" up -d do-db
docker run --rm --env-file "$ENV_FILE" --network einstore-app-platform -p 8080:8080 "$IMAGE_NAME"
