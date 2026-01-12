DOCTL ?= doctl
SPEC ?= app.yaml
SPEC_STAGING ?= app.staging.yaml
APP_ID ?= afde427c-09c9-475a-851c-c7a618040891
APP_ID_STAGING ?= <set-staging-app-id>
MIGRATION_NAME ?= baseline
MIGRATION_TEST_DB ?= einstore-test
DEV_API_PORT ?= 8080
DEV_ADMIN_PORT ?= 5173
DEV_API_DOMAIN ?= api.local.einstore.pro
DEV_ADMIN_DOMAIN ?= admin.local.einstore.pro
DEV_WEB_DOMAIN ?= local.einstore.pro
DEV_CADDYFILE ?= ./Caddyfile.dev
DEV_CORS_ORIGINS ?= https://$(DEV_ADMIN_DOMAIN),https://$(DEV_WEB_DOMAIN),http://$(DEV_ADMIN_DOMAIN),http://$(DEV_WEB_DOMAIN),http://localhost:8081,http://localhost:5173
DEV_VITE_API_BASE_URL ?= https://$(DEV_API_DOMAIN)
DEV_INBOUND_EMAIL_DOMAIN ?= $(DEV_WEB_DOMAIN)
DEV_ADMIN_CLIENT_PORT ?= 443
DEV_ADMIN_HMR_PROTOCOL ?= wss

ifeq ($(firstword $(MAKECMDGOALS)),migrate)
MIGRATE_EXTRA := $(wordlist 2,$(words $(MAKECMDGOALS)),$(MAKECMDGOALS))
MIGRATE_MODE := $(strip $(firstword $(MIGRATE_EXTRA)))
ifeq ($(MIGRATE_MODE),)
MIGRATE_MODE := default
endif
endif
MIGRATE_MODE ?= default

ifeq ($(firstword $(MAKECMDGOALS)),read)
READ_EXTRA := $(wordlist 2,$(words $(MAKECMDGOALS)),$(MAKECMDGOALS))
READ_ENVIRONMENT := $(strip $(firstword $(READ_EXTRA)))
ifeq ($(READ_ENVIRONMENT),)
READ_ENVIRONMENT := production
endif
READ_SPEC_FILE := $(if $(filter staging,$(READ_ENVIRONMENT)),$(SPEC_STAGING),$(SPEC))
READ_APP_ID := $(if $(filter staging,$(READ_ENVIRONMENT)),$(APP_ID_STAGING),$(APP_ID))
endif

ifeq ($(firstword $(MAKECMDGOALS)),deploy)
DEPLOY_EXTRA := $(wordlist 2,$(words $(MAKECMDGOALS)),$(MAKECMDGOALS))
DEPLOY_ENVIRONMENT := $(strip $(firstword $(DEPLOY_EXTRA)))
ifeq ($(DEPLOY_ENVIRONMENT),)
DEPLOY_ENVIRONMENT := production
endif
DEPLOY_SPEC_FILE := $(if $(filter staging,$(DEPLOY_ENVIRONMENT)),$(SPEC_STAGING),$(SPEC))
DEPLOY_APP_ID := $(if $(filter staging,$(DEPLOY_ENVIRONMENT)),$(APP_ID_STAGING),$(APP_ID))
endif

.PHONY: test test-unit launch docker read deploy staging migrate

launch:
	@set -e; \
	if command -v docker >/dev/null 2>&1; then \
		CONTAINERS=$$(docker ps -q --filter "name=einstore"); \
		if [ -n "$$CONTAINERS" ]; then \
			echo "Stopping running einstore containers..."; \
			docker stop $$CONTAINERS; \
		fi; \
	fi; \
	if ! command -v caddy >/dev/null 2>&1; then \
		echo "Caddy is required for dev domain routing. Install it from https://caddyserver.com/docs/install." >&2; \
		exit 1; \
	fi; \
	if pgrep -x caddy >/dev/null 2>&1; then \
		echo "Another caddy instance is already running; stop it before running 'make launch' to avoid port conflicts." >&2; \
		exit 1; \
	fi; \
	API_HOST=$(DEV_API_DOMAIN) \
	API_PORT=$(DEV_API_PORT) \
	ADMIN_HOST=$(DEV_ADMIN_DOMAIN) \
	ADMIN_PORT=$(DEV_ADMIN_PORT) \
	WEB_HOST=$(DEV_WEB_DOMAIN) \
	caddy validate --config $(DEV_CADDYFILE) --adapter caddyfile >/dev/null; \
	API_PID=""; ADMIN_PID=""; CADDY_PID=""; \
	cleanup() { \
		[ -n "$$CADDY_PID" ] && kill "$$CADDY_PID" 2>/dev/null || true; \
		[ -n "$$ADMIN_PID" ] && kill "$$ADMIN_PID" 2>/dev/null || true; \
		[ -n "$$API_PID" ] && kill "$$API_PID" 2>/dev/null || true; \
	}; \
	trap 'cleanup' INT TERM EXIT; \
	cd API && \
		PORT=$(DEV_API_PORT) \
		CORS_ORIGINS="$(DEV_CORS_ORIGINS)" \
		INBOUND_EMAIL_DOMAIN="$(DEV_INBOUND_EMAIL_DOMAIN)" \
		npm run dev & \
	API_PID=$$!; \
	cd Admin && \
		ADMIN_DEV_PORT=$(DEV_ADMIN_PORT) \
		ADMIN_DEV_HOST=0.0.0.0 \
		ADMIN_PUBLIC_HOST=$(DEV_ADMIN_DOMAIN) \
		ADMIN_DEV_CLIENT_PORT=$(DEV_ADMIN_CLIENT_PORT) \
		ADMIN_DEV_HMR_PROTOCOL=$(DEV_ADMIN_HMR_PROTOCOL) \
		VITE_API_BASE_URL=$(DEV_VITE_API_BASE_URL) \
		npm run dev & \
	ADMIN_PID=$$!; \
	API_HOST=$(DEV_API_DOMAIN) \
	API_PORT=$(DEV_API_PORT) \
	ADMIN_HOST=$(DEV_ADMIN_DOMAIN) \
	ADMIN_PORT=$(DEV_ADMIN_PORT) \
	WEB_HOST=$(DEV_WEB_DOMAIN) \
	caddy run --config $(DEV_CADDYFILE) --adapter caddyfile & \
	CADDY_PID=$$!; \
	wait $$API_PID $$ADMIN_PID $$CADDY_PID; \
	trap - INT TERM EXIT

migrate:
	@if [ "$(MIGRATE_MODE)" = "test" ]; then \
		clear; \
		echo "Running migration test cycle against '$(MIGRATION_TEST_DB)'..."; \
		BASE_URL="$${DATABASE_URL:-}"; \
		if [ -z "$$BASE_URL" ] && [ -f API/.env ]; then \
			BASE_LINE=$$(grep -E '^DATABASE_URL=' API/.env | tail -n 1); \
		if [ -n "$$BASE_LINE" ]; then \
			BASE_URL=$${BASE_LINE#DATABASE_URL=}; \
			BASE_URL=$${BASE_URL#\"}; \
			BASE_URL=$${BASE_URL%\"}; \
		fi; \
		fi; \
		if [ -z "$$BASE_URL" ]; then \
			BASE_URL="postgresql://postgres@localhost:5432/einstore?schema=public"; \
		fi; \
		TARGET_DB="$(MIGRATION_TEST_DB)"; \
		if ! command -v python3 >/dev/null 2>&1; then \
			echo "python3 is required to compute test DATABASE_URL." >&2; \
			exit 1; \
		fi; \
		TMP_FILE=$$(mktemp); \
		TMP_SCRIPT=$$(mktemp).py; \
		printf '%s\n' \
			"import os" \
			"from urllib.parse import urlparse, urlunparse" \
			"" \
			"base = os.environ.get('BASE_URL')" \
			"target = os.environ.get('TARGET_DB')" \
			"if not base:" \
			"    raise SystemExit('DATABASE_URL is not defined; set it in the environment or API/.env')" \
			"parsed = urlparse(base)" \
			"if not parsed.scheme or not parsed.netloc:" \
			"    raise SystemExit(f'Invalid DATABASE_URL: {base}')" \
			"test_uri = parsed._replace(path='/' + target)" \
			"admin_uri = parsed._replace(path='/postgres', query='')" \
			"print(urlunparse(test_uri))" \
			"print(urlunparse(admin_uri))" \
			> "$$TMP_SCRIPT"; \
		if ! BASE_URL="$$BASE_URL" TARGET_DB="$$TARGET_DB" python3 "$$TMP_SCRIPT" >"$$TMP_FILE" 2>&1; then \
			cat "$$TMP_FILE" >&2; \
			rm -f "$$TMP_FILE" "$$TMP_SCRIPT"; \
			exit 1; \
		fi; \
		TEST_URL=$$(sed -n '1p' "$$TMP_FILE"); \
		ADMIN_URL=$$(sed -n '2p' "$$TMP_FILE"); \
		rm -f "$$TMP_FILE" "$$TMP_SCRIPT"; \
		if [ -z "$$TEST_URL" ] || [ -z "$$ADMIN_URL" ]; then \
			echo "Failed to derive target database URLs from $$BASE_URL" >&2; \
			exit 1; \
		fi; \
		if ! command -v psql >/dev/null 2>&1; then \
			echo "psql not found in PATH; install PostgreSQL client tools." >&2; \
			exit 1; \
		fi; \
		echo "Resetting database '$$TARGET_DB'..."; \
		psql "$$ADMIN_URL" -v ON_ERROR_STOP=1 -q -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$$TARGET_DB';" >/dev/null 2>&1 || true; \
		psql "$$ADMIN_URL" -v ON_ERROR_STOP=1 -q -c "DROP DATABASE IF EXISTS \"$$TARGET_DB\";" >/dev/null || exit 1; \
		psql "$$ADMIN_URL" -v ON_ERROR_STOP=1 -q -c "CREATE DATABASE \"$$TARGET_DB\";" >/dev/null || exit 1; \
		echo "Applying migrations to '$$TARGET_DB'..."; \
		DATABASE_URL="$$TEST_URL" npm --prefix API run prisma:generate; \
		DATABASE_URL="$$TEST_URL" npm --prefix API run prisma:deploy; \
		echo "Migration test complete."; \
	else \
		npm --prefix API run prisma:generate; \
		npm --prefix API run prisma:migrate -- --name $(MIGRATION_NAME); \
	fi

test:
	@if [ "$(firstword $(MAKECMDGOALS))" = "migrate" ] && [ "$(MIGRATE_MODE)" = "test" ]; then \
		echo "Skipping API test suite (triggered via 'make migrate test')."; \
	else \
		npm --prefix Libraries/teams install; \
		npm --prefix Libraries/teams run build; \
		npm --prefix API run test:unit; \
		npm --prefix API run prisma:generate; \
		npm --prefix API run build; \
		PORT=8083 \
		AUTH_JWT_SECRET=change-me \
		AUTH_JWT_ISSUER=einstore \
		AUTH_JWT_AUDIENCE=einstore-api \
		AUTH_REFRESH_TTL_DAYS=30 \
		AUTH_ACCESS_TTL_MINUTES=15 \
		DATABASE_URL="postgresql://postgres@localhost:5432/einstore-test?schema=public" \
		NODE_ENV=test \
		npm --prefix API run prisma:deploy; \
		PORT=8083 \
		AUTH_JWT_SECRET=change-me \
		AUTH_JWT_ISSUER=einstore \
		AUTH_JWT_AUDIENCE=einstore-api \
		AUTH_REFRESH_TTL_DAYS=30 \
		AUTH_ACCESS_TTL_MINUTES=15 \
		DATABASE_URL="postgresql://postgres@localhost:5432/einstore-test?schema=public" \
		NODE_ENV=test \
		node API/dist/index.js > /tmp/einstore-api-test.log 2>&1 & \
		PID=$$!; \
		sleep 1; \
		newman run postman_collection.json -e API/tests/postman_environment.json; \
		STATUS=$$?; \
		kill $$PID; \
		exit $$STATUS; \
	fi

test-unit:
	@npm --prefix API run test:unit

docker:
	@docker compose down --remove-orphans
	@docker compose up --build -d
	@IP=$$(ipconfig getifaddr en0 || ipconfig getifaddr en1 || echo localhost); \
	echo "API:   http://$$IP:8080"; \
	echo "Admin: http://$$IP:8081"; \
	open http://$$IP:8081

staging:
	@:

read:
	@if ! command -v $(DOCTL) >/dev/null 2>&1; then \
		echo "$(DOCTL) not found. Install doctl and run: doctl auth init" >&2; \
		exit 1; \
	fi
	@if [ "$(READ_ENVIRONMENT)" = "staging" ]; then \
		if [ -z "$(strip $(APP_ID_STAGING))" ] || [ "$(strip $(APP_ID_STAGING))" = "<set-staging-app-id>" ]; then \
			echo "APP_ID_STAGING is not set. Export APP_ID_STAGING before running 'make read staging'." >&2; \
			exit 1; \
		fi; \
	fi
	@if [ -z "$(strip $(READ_APP_ID))" ]; then \
		echo "Unable to determine target App ID for $(READ_ENVIRONMENT) read operation." >&2; \
		exit 1; \
	fi
	@target_env="$(READ_ENVIRONMENT)"; \
	spec_file="$(READ_SPEC_FILE)"; \
	app_id="$(READ_APP_ID)"; \
	echo "Saving $$target_env DigitalOcean spec to $$spec_file..."; \
	$(DOCTL) apps spec get "$$app_id" > "$$spec_file"

deploy:
	@if [ ! -f "$(DEPLOY_SPEC_FILE)" ]; then \
		echo "Spec $(DEPLOY_SPEC_FILE) not found" >&2; \
		exit 1; \
	fi
	@if ! command -v $(DOCTL) >/dev/null 2>&1; then \
		echo "$(DOCTL) not found. Install doctl and run: doctl auth init" >&2; \
		exit 1; \
	fi
	@if [ "$(DEPLOY_ENVIRONMENT)" = "staging" ]; then \
		if [ -z "$(strip $(APP_ID_STAGING))" ] || [ "$(strip $(APP_ID_STAGING))" = "<set-staging-app-id>" ]; then \
			echo "APP_ID_STAGING is not set. Export APP_ID_STAGING before running 'make deploy staging'." >&2; \
			exit 1; \
		fi; \
	fi
	@if [ -z "$(strip $(DEPLOY_APP_ID))" ]; then \
		echo "Unable to determine target App ID for $(DEPLOY_ENVIRONMENT) deployment." >&2; \
		exit 1; \
	fi
	@echo "Deploy start time: $$(date)"
	@echo "Deploying $(DEPLOY_SPEC_FILE) to $(DEPLOY_ENVIRONMENT) app $(DEPLOY_APP_ID)..."
	@$(DOCTL) apps update $(DEPLOY_APP_ID) --spec $(DEPLOY_SPEC_FILE) --update-sources
