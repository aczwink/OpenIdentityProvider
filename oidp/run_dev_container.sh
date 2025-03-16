#!/bin/bash
docker container stop oidp_dev
docker container rm oidp_dev
docker build --network host -t oidp .
export $(cat .env | xargs)
docker run --name oidp_dev --rm --network host --env-file ./.env oidp