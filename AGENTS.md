# Agent Notes

## Local DB (debug)

```
postgresql://postgres@localhost:8102/einstore?schema=public
```

## Prod DB (debug, read-only)

```
psql service=einstore
```

## Documentation hygiene

- Keep `postman_collection.json` in the repo root up to date.
- Keep all docs in `docs/` up to date with API and behavior changes.
- Alert system usage: see `docs/alerts.md`.
- Local build debug reference: `docs/doctl-apps-dev-build.md`.
- Build failures: reproduce and fix locally first; only deploy after the local build passes.
- Always debug DigitalOcean/App Platform issues with `doctl` first.
- Deployment debugging: use `doctl` (e.g., `doctl apps logs/get/list`) before changing configs or code.
- When DigitalOcean Functions change, always deploy the functions (`doctl serverless deploy .`).
- DigitalOcean Functions namespace for this repo is `einstore` (connect with `doctl serverless connect einstore`).
- Binary handling policy: the API must never handle binary uploads or extract files. Uploads go directly to Spaces via presigned URLs (or to local MinIO). Extraction/processing of icons/files must be done by the Function (or local docker job) and return JSON only, while assets are uploaded back to S3-style storage. Local dev must start MinIO via Docker with persistent storage (no reset between launches).

## Before You Start

- Check for nested `AGENTS.md` files in any subdirectories you touch; follow the most specific instructions.
- Read `README.md` when changing project setup or structure.

## Project Layout

- `API/`: Node.js + Fastify + Prisma + Postgres.
- `Admin/`: React + Tailwind (CSR). Build all UI pieces as reusable components.
- `Web/`: React + Tailwind (CSR).
- `Libraries/`: first-party packages (feature flags, api-keys, auth, teams). You may modify them to improve/shared code. Each library must keep its own `AGENTS.md`, `CHANGELOG.md`, and docs/usage current. When upgrading a library, bump version (patch/minor as appropriate), update the changelog, and create a GitHub release with `gh release create`.
- `dev/`: legacy reference (gitignored).
- Reusable code for feature flags, api keys, teams, and auth must live inside their respective `Libraries/` packages. Do not implement reusable package logic inside `API/`, `Admin/`, or `Web/`.

## UI Conventions

- Use Tailwind tokens from `tailwind.config` for color, shadows, and radii.
- Keep visible focus rings and explicit `<label>` elements for form inputs.
- Minimum tap target height: `h-11` (44px).

## Working Style

- If something is unknown or might be outdated, say so explicitly rather than guessing.
- Stay focused on the current request; ask before changing unrelated files or content.
- Parallel/unrelated changes are expected; do not mention or ask about them.
- A master Caddy runs locally in Docker for all projects and is always on; check that config first for local domain routing.
- Never stage or commit files you didn’t edit.
- If a required file already has unrelated changes, edit only what’s needed for the current request and leave everything else untouched.
- Debug DigitalOcean Spaces with: `aws --profile einstore --endpoint-url https://lon1.digitaloceanspaces.com s3 ls s3://einstore/ --recursive`
- Third-party libraries: use only the latest stable release (no beta) unless no stable release exists; libraries from `rafiki270` are allowed.
- Code files must not exceed 500 lines unless explicitly requested by the developer.
- Worktree safety: never discard/revert uncommitted changes, especially ones not created in the current task context.
- No destructive commands unless explicitly requested (e.g., `git reset`, `git clean`, `git restore`, `rm`).
- Commit and push after each turn, but only include files you personally touched that turn—never stage or commit unrelated or pre-existing changes. This is very important: do not stage, commit, or remove any unrelated or pre-existing changes.
- Never change migrations not made in the current turn.
- If you add or modify database migrations, run `make migrate test` before committing.
- Upload presign headers are brittle: the presigned URL is generated with `SignedHeaders=host` only. Any client-sent custom header (including `Content-Type`) will invalidate the signature; keep browser PUTs free of extra headers unless the presign contract changes.

## Pagination standard

- Endpoints that list resources must accept `page` and `perPage` query params (defaults: page 1, perPage 25; max perPage 100).
- Backward compatibility: continue to accept `limit` and `offset` when present.
- List responses must return `{ items, page, perPage, total, totalPages }`.
