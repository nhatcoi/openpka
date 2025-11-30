#!/bin/sh
set -e

cd /app

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is not set; skipping Prisma migrations."
elif [ "${SKIP_MIGRATIONS:-}" = "true" ]; then
  echo "SKIP_MIGRATIONS is set; skipping Prisma migrations."
else
  echo "Running Prisma migrations..."
  npx prisma migrate deploy || {
    echo "Migration deploy failed. This might be expected if:"
    echo "  1. Database schema is already up to date"
    echo "  2. Migrations need to be baselined (existing production database)"
    echo "  3. Migration files are not in Prisma's expected format"
    echo ""
    echo "To skip migrations, set SKIP_MIGRATIONS=true"
    echo "Continuing with application startup..."
  }
fi

exec "$@"

