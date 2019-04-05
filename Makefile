help:  ## Display this help
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n\nTargets:\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-13s\033[0m %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

setup-demo: up install-demo ## Setups whole demo
	@echo "\n"
	@echo "Admin GUI should be running on http://127.0.0.1:$$(docker-compose ps -q admin | xargs docker port | cut -d':' -f2)"

up: docker-compose.yaml docker-compose.override.yaml ## Does docker-compose up, automaticly create docker-compose.override.yaml
	docker-compose up -d --remove-orphans
	@echo "\n"
	@echo "Admin GUI should be running on http://127.0.0.1:$$(docker-compose ps -q admin | xargs docker port | cut -d':' -f2)"

clean: ## Deletes all containers and volumes. WILL DROP ALL DB DATA
	docker-compose down --volumes --remove-orphans

stop: ## Stops all containers
	docker-compose stop -t 5

install-db: up ## Install basic data
	docker-compose exec api curl "http://localhost:8080/$${APICORE_SERVER_PATH_PREFIX}/install"

install-demo: up install-db ## Install demo data
	@echo "\nInstalling demo data..."
	docker-compose exec api curl "http://localhost:8080/$${APICORE_SERVER_PATH_PREFIX}/demo"

docker-compose.override.yaml:
	cp docker-compose.override.dist.yaml docker-compose.override.yaml
