#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
PROJECT_DIR="$SCRIPT_DIR/.."
export GRADLE_USER_HOME="$PROJECT_DIR/.gradle"

if command -v ./gradlew >/dev/null 2>&1; then
  (cd "$PROJECT_DIR" && ./gradlew test)
  exit 0
fi

GRADLE_BIN=${GRADLE_BIN:-/opt/homebrew/opt/gradle@8/bin/gradle}

if [ -x "$GRADLE_BIN" ]; then
  (cd "$PROJECT_DIR" && "$GRADLE_BIN" test)
  exit 0
fi

if command -v gradle >/dev/null 2>&1; then
  (cd "$PROJECT_DIR" && gradle test)
  exit 0
fi

echo "Gradle not found. Install Gradle or add a wrapper to run tests." >&2
exit 1
