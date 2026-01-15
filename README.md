# Einstore (Refactor)

Modern private app distribution platform for iOS + Android.

## Structure
- `API/` Node.js + Fastify + Prisma + Postgres
- `Admin/` React + Tailwind (CSR)
- `Web/` React + Tailwind (CSR)
- `frameworks/` Mobile tracking libraries (iOS, Android, Flutter)
- `Libraries/` External submodules (auth only)
- `dev/` Legacy reference (gitignored)

## Notes
- Auth is provided by the external `rafiki270/auth` submodule.
- This is a ground-up refactor; legacy code is reference-only.

## Run (local)
- `make launch` starts the API, Admin, local ingest function, and MinIO (persistent). Use your existing local Caddy (outside this repo) for domain routing.
- Add `/etc/hosts` entries pointing `admin.local.einstore.pro`, `api.local.einstore.pro`, and `local.einstore.pro` to `127.0.0.1`, then proxy those hosts to `localhost:8101` and `localhost:8100` in your own Caddy config.
- For App Platform build/run simulation, see `docs/app-platform-local-sim.md`.
- Default ports now live in the 8100 range: API 8100, Admin 8101, Postgres 8102 (Docker host), and the test runner on 8103.

## Uploading a binary to Einstore
1. Create or copy an API key in Admin (`API Keys`). The API key identifies the team.
2. Request a presigned URL from `/ingest/upload-url` (API key can be passed via `token` query param):
   ```bash
   curl -X POST \
     -H "Content-Type: application/json" \
     -d '{"filename":"binary.apk","sizeBytes":12345678}' \
     "https://api.local.einstore.pro/ingest/upload-url?token=YOUR_API_KEY_TOKEN"
   ```
3. Upload the binary directly to storage using the returned `uploadUrl`, honoring the `headers` payload if provided.
4. Finalize the upload with `/ingest/complete-upload` (send `key` from step 2).
5. Teams have a storage quota (default 1 GB). If an upload would exceed the quota, the API purges the oldest builds first (never deletes the last build of an app). If no space can be freed, the upload is rejected with a clear error.

## Integration tests (Newman)
- Requirements: API running locally, valid `accessToken`, `teamId`, `apiKeyToken`, and sample APK/IPA paths.
- Update `tests/newman/local.postman_environment.json` with your tokens and file paths.
- Run: `cd API && npm run test:integration`
- The command executes the Postman collection folders: `Ingest Upload (APK)` and `Ingest Upload (IPA)` against `postman_collection.json`.
