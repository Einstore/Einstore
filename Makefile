.PHONY: test test-unit launch docker

launch:
	@set -e; \
	cd API && npm run dev & \
	API_PID=$$!; \
	cd Admin && npm run dev & \
	ADMIN_PID=$$!; \
	trap 'kill $$API_PID $$ADMIN_PID' INT TERM; \
	wait $$API_PID $$ADMIN_PID

test:
	@npm --prefix API run test:unit
	@PORT=8083 \
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
