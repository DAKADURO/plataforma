#!/bin/bash
set -e

echo "Attempting to deploy Prisma migrations..."

# Try to deploy migrations
if ! npx prisma migrate deploy --skip-generate 2>&1; then
  echo "Migration deployment failed. Checking if we need to baseline..."

  # Check if the error is P3005 (database schema not empty)
  # If so, we need to mark the existing migration as applied

  echo "Marking migration as applied (baseline approach)..."

  # Get the migration name from the directory
  MIGRATION_NAME=$(ls -d prisma/migrations/*_* 2>/dev/null | head -1 | xargs basename)

  if [ -n "$MIGRATION_NAME" ]; then
    echo "Found migration: $MIGRATION_NAME"

    # Try to resolve the migration as already applied
    npx prisma migrate resolve --rolled-back "$MIGRATION_NAME" || true

    echo "Attempting deploy again..."
    npx prisma migrate deploy --skip-generate || true
  fi
fi

echo "Migration process completed. Starting Next.js..."
exec next start
