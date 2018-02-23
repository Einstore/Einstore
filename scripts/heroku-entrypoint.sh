#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

: "${DATABASE_URL?Required env variable DATABASE_URL is missing}"
echo "$DATABASE_URL" | while IFS="/:@" read -r _ _ _ DB_USER DB_PASSWORD DB_HOST DB_PORT DB_NAME; do
	export DB_USER
	export DB_PASSWORD
	export DB_HOST
	export DB_PORT
	export DB_NAME

	Run --hostname=0.0.0.0 --port="$PORT"
	break
done
