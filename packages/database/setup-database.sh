#!/bin/bash
# Database Setup Script for RCT Apps
# Runs all migrations in order to setup the database schema

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🗄️  Setting up RCT Database Schema${NC}"
echo "================================================="

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo -e "${RED}❌ ERROR: DATABASE_URL environment variable is not set${NC}"
  echo "Please set DATABASE_URL in your .env file or environment"
  echo "Example: DATABASE_URL=postgresql://user:password@localhost:5432/rct_db"
  exit 1
fi

echo -e "${YELLOW}📡 Database URL: ${DATABASE_URL}${NC}"

# Function to run a migration
run_migration() {
  local file=$1
  local description=$2
  
  echo -e "${BLUE}⚙️  Running: $description${NC}"
  
  if psql "$DATABASE_URL" -f "$file"; then
    echo -e "${GREEN}✅ Success: $description${NC}"
  else
    echo -e "${RED}❌ Failed: $description${NC}"
    exit 1
  fi
  
  echo ""
}

# Check if database exists and is accessible
echo -e "${BLUE}🔍 Testing database connection...${NC}"
if psql "$DATABASE_URL" -c "SELECT 1" > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Database connection successful${NC}"
else
  echo -e "${RED}❌ Cannot connect to database${NC}"
  echo "Please make sure PostgreSQL is running and DATABASE_URL is correct"
  exit 1
fi

echo ""

# Run migrations in order
echo -e "${BLUE}🚀 Running database migrations...${NC}"
echo ""

# Migration 001: Initial Schema
run_migration "src/migrations/001_initial_schema.sql" "Initial database schema (users, groups, messages, etc.)"

# Migration 002: Fix Message ID to BIGINT  
run_migration "src/migrations/002_fix_message_id_bigint.sql" "Convert message ID from UUID to BIGINT"

# Migration 003: Add Constraints
run_migration "src/migrations/003_add_constraints.sql" "Add CHECK constraints and validation rules"

# Migration 004: Add Partial Indexes
run_migration "src/migrations/004_add_partial_indexes.sql" "Add business rule indexes and performance optimizations"

# Migration 005: Align Field Names
run_migration "src/migrations/005_align_field_names.sql" "Fix field name alignment for Prisma ORM"

echo -e "${GREEN}🎉 Database setup completed successfully!${NC}"
echo ""
echo -e "${BLUE}📊 Database Summary:${NC}"
echo "  • Tables: 10 (users, groups, messages, etc.)"
echo "  • Constraints: Business rules enforced"
echo "  • Indexes: Optimized for performance"  
echo "  • Field alignment: Ready for Prisma ORM"
echo ""
echo -e "${YELLOW}💡 Next steps:${NC}"
echo "  1. Generate Prisma client: cd apps/backend && npx prisma generate"
echo "  2. Start backend development with proper ORM models"
echo "  3. Implement authentication system"
echo ""
echo -e "${GREEN}✨ Ready for development!${NC}"