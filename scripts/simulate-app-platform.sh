#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="${ROOT_DIR}/docker-compose.app-platform.yml"
ENV_FILE="${APP_PLATFORM_ENV_FILE:-${ROOT_DIR}/scripts/app-platform.env}"

RUN_STATIC="false"
RUN_BUILD="true"
RUN_RUN="true"

usage() {
  cat <<'USAGE'
Usage: scripts/simulate-app-platform.sh [options]

Options:
  --static           Build Admin/Web static sites too.
  --build-only       Only run the build step.
  --run-only         Only run the runtime step.
  --env-file PATH    Override the env file (default: scripts/app-platform.env).
  -h, --help         Show this help text.
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --static)
      RUN_STATIC="true"
      shift
      ;;
    --build-only)
      RUN_RUN="false"
      shift
      ;;
    --run-only)
      RUN_BUILD="false"
      shift
      ;;
    --env-file)
      ENV_FILE="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if [[ "$RUN_BUILD" == "false" && "$RUN_RUN" == "false" ]]; then
  echo "Pick either --build-only or --run-only, not both." >&2
  exit 1
fi

if [[ "$RUN_RUN" == "true" || "$RUN_STATIC" == "true" ]]; then
  if [[ ! -f "$ENV_FILE" ]]; then
    echo "Missing env file: $ENV_FILE" >&2
    echo "Copy scripts/app-platform.env.example to scripts/app-platform.env and fill it in." >&2
    exit 1
  fi
fi

export APP_PLATFORM_ENV_FILE="$ENV_FILE"
export DOCKER_UID="${DOCKER_UID:-$(id -u)}"
export DOCKER_GID="${DOCKER_GID:-$(id -g)}"

if [[ "$RUN_BUILD" == "true" ]]; then
  rm -rf "${ROOT_DIR}/API/node_modules"
  docker compose -f "$COMPOSE_FILE" run --rm do-api-build
fi

if [[ "$RUN_STATIC" == "true" ]]; then
  rm -rf "${ROOT_DIR}/Admin/node_modules" "${ROOT_DIR}/Admin/dist"
  docker compose -f "$COMPOSE_FILE" run --rm do-admin-build
  docker compose -f "$COMPOSE_FILE" run --rm do-web-build
fi

if [[ "$RUN_RUN" == "true" ]]; then
  docker compose -f "$COMPOSE_FILE" up --abort-on-container-exit do-api-run
fi
