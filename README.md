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
- `make launch` starts the API and Admin dev servers plus Caddy for local domains.
- For App Platform build/run simulation, see `docs/app-platform-local-sim.md`.
- With DNS entries for `admin.local.einstore.pro`, `api.local.einstore.pro`, and `local.einstore.pro`, you can access the dev stack from other devices at `https://admin.local.einstore.pro` and `https://api.local.einstore.pro` (Caddy terminates HTTPS with local certificates; override `DEV_*` vars in the Makefile if you need different ports).

## Uploading a binary to Einstore
1. Create or copy an API key in Admin (`API Keys`). The API key identifies the team.
2. Upload any file with a multipart request to `/store/upload`, passing the API key as a `token` query param (no auth header required):
   ```bash
   curl -X POST \
     -F "file=@/path/to/binary.apk" \
     "https://api.local.einstore.pro/store/upload?token=YOUR_API_KEY_TOKEN"
   ```
3. The response includes `filePath` and `sizeBytes` confirming the file is stored. Use that path when triggering ingest or other workflows.
4. Teams have a storage quota (default 1 GB). If an upload would exceed the quota, the API purges the oldest builds first (never deletes the last build of an app). If no space can be freed, the upload is rejected with a clear error.
