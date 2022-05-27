#!/bin/sh
export $(egrep -v '^#' .env | xargs)
docker login ${DOCKER_REPO} -u nologin -p ${DOCKER_PASSWORD}

docker-compose pull
docker-compose up -d --remove-orphans