#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
PROJECT_DIR="$SCRIPT_DIR/.."

if command -v ./gradlew >/dev/null 2>&1; then
  (cd "$PROJECT_DIR" && ./gradlew test)
  exit 0
fi

if command -v gradle >/dev/null 2>&1; then
  (cd "$PROJECT_DIR" && gradle test)
  exit 0
fi

echo "Gradle not found. Install Gradle or add a wrapper to run tests." >&2
exit 1
