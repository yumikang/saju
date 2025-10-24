#!/bin/bash

# ============================================================
# Prisma Migration Creation Script
# ============================================================
# This script creates a new Prisma migration for CalendarData model
#
# Usage: ./scripts/calendar-migration/00-create-migration.sh
# ============================================================

set -e

echo "🚀 Creating Prisma migration for CalendarData model..."
echo ""

# Check if we're in the project root
if [ ! -f "package.json" ]; then
  echo "❌ Error: Please run this script from the project root directory"
  exit 1
fi

# Check if Prisma is installed
if ! command -v npx &> /dev/null; then
  echo "❌ Error: npx not found. Please install Node.js and npm"
  exit 1
fi

echo "📋 Checking database connection..."
if ! npx prisma db execute --stdin < /dev/null &> /dev/null; then
  echo "⚠️  Warning: Could not connect to database. Make sure DATABASE_URL is set correctly."
  echo "   You can continue and fix the connection later."
  read -p "   Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

echo ""
echo "📝 Creating migration..."
npx prisma migrate dev --name add_calendar_data_model

echo ""
echo "✅ Migration created successfully!"
echo ""
echo "📌 Next steps:"
echo "   1. Review the migration in prisma/migrations/"
echo "   2. Run './scripts/calendar-migration/01-import-schema1.ts' to import 1900-2100 data"
echo "   3. Run './scripts/calendar-migration/02-import-schema2.ts' to import 1841-2110 data"
echo "   4. Run './scripts/calendar-migration/03-validate-data.ts' to validate imported data"
echo ""
