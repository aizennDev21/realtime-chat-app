# 🗄️ Database Package - RCT Apps

This package contains all database-related files for RCT (Real-time Chat Technology) application.

## 📁 Structure

```
packages/database/
├── src/
│   └── migrations/          # SQL migration files
│       ├── 001_initial_schema.sql
│       ├── 002_fix_message_id_bigint.sql
│       ├── 003_add_constraints.sql
│       ├── 004_add_partial_indexes.sql
│       └── 005_align_field_names.sql
├── setup-database.sh       # Database setup script
└── package.json
```

## 🚀 Quick Setup

### Prerequisites
- PostgreSQL 14+ running
- `DATABASE_URL` environment variable set

### Setup Database

```bash
# 1. Set environment variable
export DATABASE_URL="postgresql://user:password@localhost:5432/rct_db"

# 2. Run setup script
cd packages/database
./setup-database.sh
```

### Alternative: Manual Migration

```bash
# Run each migration manually
psql $DATABASE_URL -f src/migrations/001_initial_schema.sql
psql $DATABASE_URL -f src/migrations/002_fix_message_id_bigint.sql
psql $DATABASE_URL -f src/migrations/003_add_constraints.sql
psql $DATABASE_URL -f src/migrations/004_add_partial_indexes.sql
psql $DATABASE_URL -f src/migrations/005_align_field_names.sql
```

## 📋 Migration Details

### Migration 001: Initial Schema
- **Purpose**: Creates all basic tables and relationships
- **Tables**: `users`, `groups`, `group_members`, `messages`, `vip_group_requests`, `invite_codes`, `audit_logs`, `refresh_tokens`, `unread_messages`, `notifications`
- **Features**: Basic indexes, foreign keys, enum constraints

### Migration 002: Fix Message ID to BIGINT
- **Purpose**: Converts message IDs from UUID to BIGINT for proper cursor pagination
- **Impact**: Critical for message ordering and performance
- **Changes**: Updates `messages.id` and related references

### Migration 003: Add Constraints  
- **Purpose**: Adds CHECK constraints for data validation
- **Rules**: Email format, username pattern, field lengths, business logic
- **Examples**: VIP groups must have owners, TEXT messages must have content

### Migration 004: Add Partial Indexes
- **Purpose**: Enforces business rules and optimizes performance
- **Business Rules**: 
  - One PENDING VIP request per user
  - One OWNER per group
  - Unique active memberships
- **Performance**: Text search, timeline queries, user lookups

### Migration 005: Align Field Names
- **Purpose**: Ensures consistency between SQL schema and Prisma schema
- **Changes**: Renames fields, adds missing columns, fixes timestamp precision
- **Impact**: Enables proper ORM mapping

## 🎯 Schema Features

### ✅ Implemented
- **10 Tables** with proper relationships
- **Business Rule Constraints** via CHECK and unique indexes
- **Performance Indexes** for common queries
- **Audit Trail** with append-only protection
- **Soft Delete** support for users and groups
- **Token Rotation** for refresh tokens
- **Cursor Pagination** support for messages

### 🔒 Security Features
- Password hashing ready (Argon2id)
- Audit logs are append-only (protected by triggers)
- Soft delete preserves data relationships
- Input validation via CHECK constraints

### ⚡ Performance Optimizations
- Partial indexes for business rules
- Full-text search ready (pg_trgm)
- Message timeline optimized for chat UI
- Proper foreign key indexes

## 🧩 Integration

### With Backend (NestJS + Prisma)
```bash
# Generate Prisma client after database setup
cd apps/backend
npx prisma db pull  # Pull schema from database
npx prisma generate # Generate TypeScript client
```

### With Docker Compose
```yaml
# In docker-compose.yml
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: rct_db
      POSTGRES_USER: rct_user
      POSTGRES_PASSWORD: rct_password
    volumes:
      - ./packages/database/src/migrations:/docker-entrypoint-initdb.d
```

## 📊 Database Stats

| Feature | Count |
|---------|-------|
| Tables | 10 |
| Indexes | ~25 |
| Constraints | ~20 |
| Business Rules | 7 |
| Performance Optimizations | 8 |

## 🔧 Maintenance

### Adding New Migrations
1. Create `00X_description.sql` in `src/migrations/`
2. Update `setup-database.sh` to include new migration
3. Test migration on development database
4. Update this README

### Schema Changes
- Always use migrations (never edit existing migration files)
- Follow naming convention: `NNN_descriptive_name.sql`
- Include both UP and DOWN operations when possible
- Update Prisma schema accordingly

## 🚨 Important Notes

- **Message IDs are BIGINT**: For cursor-based pagination (required by PRD)
- **Timestamps are TIMESTAMPTZ(6)**: For microsecond precision
- **Audit logs are append-only**: Protected by database triggers
- **Business rules in DB**: Enforced at database level for data integrity

## 🔗 Related Documentation

- [PRD.md](../../context/PRD.md) - Product requirements
- [schema.md](../../context/schema.md) - Detailed schema documentation  
- [architecture.md](../../context/architecture.md) - System architecture
- [Backend README](../../apps/backend/README.md) - Backend integration

---

**Ready for development!** 🚀