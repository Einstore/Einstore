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
