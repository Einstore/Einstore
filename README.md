# Einstore (Refactor)

Modern private app distribution platform for iOS + Android.

## Structure
- `API/` Node.js + Fastify + Prisma + Postgres
- `Admin/` React + Tailwind (CSR)
- `Web/` React + Tailwind (CSR)
- `Libraries/` External submodules (auth only)
- `dev/` Legacy reference (gitignored)

## Notes
- Auth is provided by the external `rafiki270/auth` submodule.
- This is a ground-up refactor; legacy code is reference-only.

## Run (local)
- `make launch` starts the API and Admin dev servers.
