# App Platform Local Simulation

This mirrors the App Platform build/run flow locally to reproduce failures without a DO roundtrip.

## Setup
- Copy `scripts/app-platform.env.example` to `scripts/app-platform.env` and fill in secrets.
- `DATABASE_URL` in the example points at the local Docker Postgres (`do-db`).
- Export `BILLING_DEPLOY_KEY` before build commands if you need the Billing clone step.

## API build (mirrors DO buildpack)
```
docker compose -f docker-compose.app-platform.yml run --rm do-api-build
```

## API run (mirrors DO run)
```
docker compose -f docker-compose.app-platform.yml up do-api-run
```

Notes:
- `npm run prisma:ensure-schema` runs every time; set `ENABLE_SCHEMA_CREATE=true` in the env file if you need schema creation.
- Set `RUN_PRISMA_DEPLOY=true` to include `npm run prisma:deploy` (matches the DO run command if migrations are re-enabled).

## One-shot script
```
scripts/simulate-app-platform.sh
```

Options:
- `--static` also builds the Admin/Web static sites.
- `--build-only` or `--run-only` to split the flow.
- `--env-file PATH` to override the default env file.

## Static sites
Admin build (same envs as DO):
```
docker compose -f docker-compose.app-platform.yml run --rm do-admin-build
```

Web has no build command in `app.yaml` (static output is served from `Web/`), so the helper is a no-op:
```
docker compose -f docker-compose.app-platform.yml run --rm do-web-build
```

## Pack build option (App Platform buildpack emulation)
`scripts/pack-app-platform.sh` builds with `pack` using `heroku/builder:24` and runs the resulting image on the same Docker network as `do-db`.

Notes:
- Uses `API/Procfile.app-platform` for the runtime command.
- The custom build command runs via the `do:build` script in `API/package.json`.
- If your builder supports it, set `PACK_NODE_INSTALL=ci` to force `npm ci` during pack builds.
