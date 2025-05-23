#!/bin/bash
docker compose --env-file=.env -f docker-compose.dev.yml up -d &
source ./server/env/bin/activate && python ./server/manage.py runserver 0.0.0.0:8000 2>&1 | sed 's/^/[SERVER] /' &
BACKEND_PID=$!
cd ./client && pnpm dev 2>&1 | sed 's/^/[CLIENT] /' &
FRONTEND_PID=$!
trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait
