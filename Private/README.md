# Private Modules

Closed-source modules live in `/Private/<module>/`. Each module provides:
- `private.manifest.json`: declarative manifest (see example below).
- API plugin entry (ESM JavaScript) for Fastify routing.
- Optional Admin route component for UI + menu.
- Optional Prisma schema fragment and migrations.

The build step `node scripts/prepare-private.mjs` discovers modules, generates API/Admin registries, and stitches private Prisma schema/migrations. The regular build succeeds when `/Private` is empty.

## Manifest schema (`Private/private.manifest.json`)
```json
{
  "id": "billing",
  "name": "Billing",
  "api": { "entry": "./api/index.js" },
  "ui": {
    "routePath": "/billing",
    "component": "./ui/Route.tsx",
    "menu": { "label": "Billing", "icon": "settings" },
    "page": {
      "title": "Billing",
      "breadcrumbs": [{ "label": "Billing" }],
      "actions": []
    }
  },
  "db": {
    "schema": "./prisma/schema.prisma",
    "migrations": "./prisma/migrations"
  }
}
```

Notes:
- `api.entry` **must be ESM JavaScript** resolvable at runtime (built output of the module). It should export `register` (Fastify plugin) or a default function.
- `ui.component` can be `.tsx/.ts/.jsx/.js`; it is lazy-loaded into Admin.
- Menu items are ordered alphabetically and rendered above Settings. The `id` is derived from `routePath` (e.g., `/billing` → `billing`).
- Prisma fragments must not declare generators/datasources—only models/enums. Migrations are copied into a generated folder and applied automatically during `prisma migrate deploy`.

## Build commands
- API: `npm run dev`, `npm run prisma:generate`, `npm run prisma:deploy`, `npm run build` all call `scripts/prepare-private.mjs` to stitch private modules.
- Admin: `npm run dev` and `npm run build` call `scripts/prepare-private.mjs` to generate private routes/menu config.

## DigitalOcean deploy (private modules)
- Add a deploy key to this repo (read-only).
- Set `BILLING_DEPLOY_KEY` as a build-time secret in DO.
- Pre-build (already wired in `app.yaml`): write the key to `~/.ssh`, add `github.com` to `known_hosts`, `git clone git@github.com:Einstore/Billing.git ../Private/billing`, then run the normal build so `prepare-private.mjs` picks it up.

## Adding a module
1) Create `/Private/<module>/private.manifest.json` as above.
2) Add `api/` plugin (ESM) and optional `ui/` route component.
3) Add optional Prisma fragment + migrations (timestamps recommended).
4) Run `node scripts/prepare-private.mjs`.
5) Run API/Admin builds as usual.
