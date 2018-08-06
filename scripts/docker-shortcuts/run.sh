#!/usr/bin/env bash

docker build -t boost .

docker run \
    -e APICORE_DATABASE_HOST=docker.for.mac.host.internal \
    -e APICORE_DATABASE_USER=boost \
    -e APICORE_DATABASE_DATABASE=boost \
    -e APICORE_DATABASE_LOGGING=1 \
    -e APICORE_SERVER_MAX_UPLOAD_FILESIZE=500 \
    -p 8080:8080 \
    boost
