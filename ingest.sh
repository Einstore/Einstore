#!/usr/bin/env bash
set -euo pipefail

API_BASE_URL="${EINSTORE_API_BASE_URL:-https://api.einstore.pro}"
API_KEY="${EINSTORE_API_KEY:-}"
FILE_PATH="${EINSTORE_FILE:-}"
KIND="${EINSTORE_KIND:-}"

if [[ -z "$API_KEY" ]]; then
  echo "EINSTORE_API_KEY is required." >&2
  exit 1
fi

if [[ -z "$FILE_PATH" ]]; then
  echo "EINSTORE_FILE is required." >&2
  exit 1
fi

if [[ ! -f "$FILE_PATH" ]]; then
  echo "File not found: $FILE_PATH" >&2
  exit 1
fi

file_size() {
  if stat -c%s "$1" >/dev/null 2>&1; then
    stat -c%s "$1"
    return
  fi
  stat -f%z "$1"
}

json_payload() {
  local filename="$1"
  local size="$2"
  local key="${3:-}"
  if command -v jq >/dev/null 2>&1; then
    if [[ -n "$key" ]]; then
      jq -n --arg filename "$filename" --argjson size "$size" --arg key "$key" \
        '{filename: $filename, sizeBytes: $size, key: $key}'
    else
      jq -n --arg filename "$filename" --argjson size "$size" \
        '{filename: $filename, sizeBytes: $size}'
    fi
    return
  fi
  if command -v python3 >/dev/null 2>&1; then
    python3 - "$filename" "$size" "$key" <<'PY'
import json
import sys

filename = sys.argv[1]
size = int(sys.argv[2])
key = sys.argv[3] if len(sys.argv) > 3 else ""
payload = {"filename": filename, "sizeBytes": size}
if key:
  payload["key"] = key
print(json.dumps(payload))
PY
    return
  fi
  echo "jq or python3 is required to build JSON payloads." >&2
  exit 1
}

json_get() {
  local payload="$1"
  local key="$2"
  if command -v jq >/dev/null 2>&1; then
    echo "$payload" | jq -r ".$key"
    return
  fi
  if command -v python3 >/dev/null 2>&1; then
    python3 - "$key" <<'PY'
import json
import sys

key = sys.argv[1]
payload = json.loads(sys.stdin.read())
value = payload.get(key)
print("" if value is None else value)
PY
    return
  fi
  echo "jq or python3 is required to parse JSON responses." >&2
  exit 1
}

filename="$(basename "$FILE_PATH")"
extension="${filename##*.}"
extension="$(printf "%s" "$extension" | tr '[:upper:]' '[:lower:]')"
if [[ -z "$KIND" ]]; then
  case "$extension" in
    ipa|apk) KIND="$extension" ;;
    *) ;;
  esac
fi
if [[ "$KIND" != "ipa" && "$KIND" != "apk" ]]; then
  echo "Unable to infer build kind. Set EINSTORE_KIND=ipa or apk." >&2
  exit 1
fi

size_bytes="$(file_size "$FILE_PATH")"
payload="$(json_payload "$filename" "$size_bytes")"

upload_response="$(
  curl -fsSL \
    -H "Content-Type: application/json" \
    -H "x-api-key: $API_KEY" \
    -d "$payload" \
    "$API_BASE_URL/ingest/upload-url"
)"

upload_url="$(json_get "$upload_response" "uploadUrl")"
upload_key="$(json_get "$upload_response" "key")"

if [[ -z "$upload_url" || -z "$upload_key" ]]; then
  echo "Failed to obtain upload URL." >&2
  exit 1
fi

curl -fsSL \
  -X PUT \
  -H "Content-Type:" \
  -H "Expect:" \
  --upload-file "$FILE_PATH" \
  "$upload_url" >/dev/null

complete_payload="$(json_payload "$filename" "$size_bytes" "$upload_key")"

complete_response="$(
  curl -fsSL \
    -H "Content-Type: application/json" \
    -H "x-api-key: $API_KEY" \
    -d "$complete_payload" \
    "$API_BASE_URL/ingest/complete-upload"
)"

job_id="$(json_get "$complete_response" "jobId")"
status="$(json_get "$complete_response" "status")"
if [[ -n "$job_id" ]]; then
  echo "Ingest queued ($status, job $job_id)."
else
  printf "%s\n" "$complete_response"
fi
