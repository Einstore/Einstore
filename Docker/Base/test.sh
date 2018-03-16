#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

function assert-version
{
    EXPECTED="$1"
    VERSION="$(${@:2} 2>&1 | head -n 1 || true)"

    if [[ "$VERSION" != "$EXPECTED" ]]; then
        echo "$2 version: expected $EXPECTED but is $VERSION"
        return 1
    fi
    echo "$2 version is $EXPECTED, ok"
}

assert-version 'Python 2.7.12' python --version
assert-version 'java version "1.7.0_95"' java -version
