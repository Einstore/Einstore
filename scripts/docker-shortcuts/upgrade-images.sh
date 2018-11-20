#!/usr/bin/env bash

# Build
echo "🤖 Upgrade images for docker-compose"

docker pull liveui/boost:latest
docker pull postgres
docker pull adminer
docker pull nginx
