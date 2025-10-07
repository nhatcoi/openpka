#!/bin/sh
set -e

# Using external DB host; do not run prisma migrations on container start.
# Ensure DATABASE_URL is configured and migrations are applied externally.

exec "$@"
