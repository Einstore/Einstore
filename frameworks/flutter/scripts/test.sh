#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
PROJECT_DIR="$SCRIPT_DIR/.."
export DART_BIN=${DART_BIN:-/opt/homebrew/opt/dart-sdk/bin/dart}

cd "$PROJECT_DIR"

if [ -x "$DART_BIN" ]; then
  "$DART_BIN" test
else
  dart test
fi
