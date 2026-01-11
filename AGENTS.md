# Agent Notes

## Local DB (debug)

```
postgresql://postgres@localhost:5432/einstore?schema=public
```

## Documentation hygiene

- Keep `postman_collection.json` in the repo root up to date.
- Keep all docs in `docs/` up to date with API and behavior changes.
- Alert system usage: see `docs/alerts.md`.
- Build failures: reproduce and fix locally first; only deploy after the local build passes.
- Always debug DigitalOcean/App Platform issues with `doctl` first.
- Deployment debugging: use `doctl` (e.g., `doctl apps logs/get/list`) before changing configs or code.

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
- Never stage or commit files you didn’t edit.
- If a required file already has unrelated changes, edit only what’s needed for the current request and leave everything else untouched.
- Third-party libraries: use only the latest stable release (no beta) unless no stable release exists; libraries from `rafiki270` are allowed.
- Code files must not exceed 500 lines unless explicitly requested by the developer.
- Worktree safety: never discard/revert uncommitted changes, especially ones not created in the current task context.
- No destructive commands unless explicitly requested (e.g., `git reset`, `git clean`, `git restore`, `rm`).
- Commit and push after each turn.
