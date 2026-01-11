DOCTL ?= doctl
SPEC ?= app.yaml
SPEC_STAGING ?= app.staging.yaml
APP_ID ?= afde427c-09c9-475a-851c-c7a618040891
APP_ID_STAGING ?= <set-staging-app-id>

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

.PHONY: test test-unit launch docker read deploy staging

launch:
	@set -e; \
	cd API && npm run dev & \
	API_PID=$$!; \
	cd Admin && npm run dev & \
	ADMIN_PID=$$!; \
	trap 'kill $$API_PID $$ADMIN_PID' INT TERM; \
	wait $$API_PID $$ADMIN_PID

test:
	@npm --prefix Libraries/teams install
	@npm --prefix Libraries/teams run build
	@npm --prefix API run test:unit
	@npm --prefix API run prisma:generate
	@npm --prefix API run build
	@PORT=8083 \
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
	exit $$STATUS

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
	@echo "Deploying $(DEPLOY_SPEC_FILE) to $(DEPLOY_ENVIRONMENT) app $(DEPLOY_APP_ID)..."
	@$(DOCTL) apps update $(DEPLOY_APP_ID) --spec $(DEPLOY_SPEC_FILE) --update-sources
