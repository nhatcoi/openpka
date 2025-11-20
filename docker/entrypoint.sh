#!/bin/sh
set -e

cd /app

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is not set; skipping Prisma migrations."
else
  echo "Running Prisma migrations..."
  npx prisma migrate deploy
fi

exec "$@"

