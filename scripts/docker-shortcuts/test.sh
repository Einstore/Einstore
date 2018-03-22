#!/usr/bin/env bash

docker build -t boost .

docker run \
    -e DB_HOST=docker.for.mac.host.internal \
    -e DB_PORT=5432 \
    -e DB_USER=boost \
    -e DB_PASSWORD=aaaaaa \
    -e DB_NAME=boost-test \
    -e DB_LOGGING=1 \
    -p 8080:8080 \
    boost
