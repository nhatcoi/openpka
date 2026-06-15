#!/bin/sh
set -e

cd /app

echo "Starting application without Prisma migrations."

exec "$@"
