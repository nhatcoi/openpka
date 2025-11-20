#!/bin/sh
set -e

if [ -f "/docker-entrypoint-initdb.d/training_system.dump" ]; then
  echo "Restoring database from training_system.dump..."
  export PGPASSWORD="${POSTGRES_PASSWORD:-}"
  pg_restore \
    --clean \
    --if-exists \
    --no-owner \
    --host=localhost \
    --username="${POSTGRES_USER}" \
    --dbname="${POSTGRES_DB}" \
    /docker-entrypoint-initdb.d/training_system.dump
  echo "Database restore complete."
else
  echo "training_system.dump not found; skipping restore."
fi



