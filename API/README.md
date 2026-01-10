# Einstore API

Fastify + Prisma baseline for the refactor.

## Env
Copy `.env.example` to `.env` and update values.
Auth settings are required (`AUTH_JWT_*`).

## Scripts
- `npm run dev` - development server
- `npm run build` - compile TypeScript
- `npm run start` - run compiled server
- `npm run prisma:generate` - generate Prisma client
- `npm run prisma:migrate` - create and apply migrations

## Endpoints (initial)
- `GET /health`
- `GET /info`
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/session`
- `POST /auth/password-reset`
- `POST /auth/password-reset/confirm`
- `POST /apps`
- `GET /apps`
- `GET /apps/:id`
- `POST /versions`
- `GET /versions`
- `GET /versions/:id`
- `POST /builds`
- `GET /builds`
- `GET /builds/:id`
- `POST /targets`
- `GET /targets`
- `POST /variants`
- `GET /variants`
- `POST /modules`
- `GET /modules`
- `POST /capabilities`
- `GET /capabilities`
- `POST /artifacts`
- `GET /artifacts`
- `POST /ingest`
- `POST /resolve-install`
- `GET /storage`
- `POST /storage`
