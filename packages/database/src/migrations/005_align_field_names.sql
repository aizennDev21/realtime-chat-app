-- Migration: Fix field name alignment between SQL schema and Prisma schema
-- Ensures consistency for ORM mapping

-- ═══════════════════════════════════════════════════════════════════════════════
-- USERS TABLE ALIGNMENT
-- ═══════════════════════════════════════════════════════════════════════════════

-- Add missing fields in users table
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Update timestamp precision to match Prisma schema
ALTER TABLE users 
  ALTER COLUMN created_at TYPE TIMESTAMPTZ(6),
  ALTER COLUMN updated_at TYPE TIMESTAMPTZ(6);

-- Fix last_login_at -> last_seen_at if needed (this was inconsistent)
-- Note: Keeping both for now as last_login_at might be used elsewhere

-- ═══════════════════════════════════════════════════════════════════════════════
-- GROUPS TABLE ALIGNMENT  
-- ═══════════════════════════════════════════════════════════════════════════════

-- Rename member_limit to max_members to match Prisma
ALTER TABLE groups 
  RENAME COLUMN member_limit TO max_members;

-- Add missing fields
ALTER TABLE groups 
  ADD COLUMN IF NOT EXISTS slug VARCHAR(64) UNIQUE,
  ADD COLUMN IF NOT EXISTS invite_code VARCHAR(16) UNIQUE,
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES users(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS last_message_id BIGINT,
  ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMPTZ(6),
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ(6),
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ(6);

-- Update timestamp precision
ALTER TABLE groups 
  ALTER COLUMN created_at TYPE TIMESTAMPTZ(6),
  ALTER COLUMN updated_at TYPE TIMESTAMPTZ(6);

-- Generate slugs for existing groups (if any)
UPDATE groups 
SET slug = LOWER(REPLACE(name, ' ', '-')) || '-' || SUBSTRING(id::text, 1, 8)
WHERE slug IS NULL;

-- ═══════════════════════════════════════════════════════════════════════════════
-- GROUP_MEMBERS TABLE ALIGNMENT
-- ═══════════════════════════════════════════════════════════════════════════════

-- Add missing fields
ALTER TABLE group_members 
  ADD COLUMN IF NOT EXISTS is_muted BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_read_message_id BIGINT,
  ADD COLUMN IF NOT EXISTS banned_reason VARCHAR(200),
  ADD COLUMN IF NOT EXISTS left_at TIMESTAMPTZ(6);

-- Update timestamp precision  
ALTER TABLE group_members 
  ALTER COLUMN joined_at TYPE TIMESTAMPTZ(6);

-- Rename is_banned to status enum (more complex, will create new approach)
-- For now, add status column and map is_banned
ALTER TABLE group_members 
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ACTIVE' 
  CHECK (status IN ('ACTIVE', 'LEFT', 'KICKED', 'BANNED'));

-- Map existing is_banned to status
UPDATE group_members 
SET status = CASE 
  WHEN is_banned = true THEN 'BANNED'
  ELSE 'ACTIVE'
END
WHERE status = 'ACTIVE'; -- Only update defaults

-- ═══════════════════════════════════════════════════════════════════════════════
-- VIP_GROUP_REQUESTS TABLE ALIGNMENT
-- ═══════════════════════════════════════════════════════════════════════════════

-- Rename fields to match Prisma schema
ALTER TABLE vip_group_requests 
  RENAME COLUMN estimated_members TO estimated_members;  -- Already correct
  
-- Add missing fields
ALTER TABLE vip_group_requests 
  ADD COLUMN IF NOT EXISTS reviewed_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ(6),
  ADD COLUMN IF NOT EXISTS approved_max_members INTEGER,
  ADD COLUMN IF NOT EXISTS created_group_id UUID UNIQUE REFERENCES groups(id) ON DELETE SET NULL;

-- Update field names to match Prisma
-- processed_by_id -> reviewed_by_id (if different)
-- processed_at -> reviewed_at (if different)

-- Update timestamp precision
ALTER TABLE vip_group_requests 
  ALTER COLUMN created_at TYPE TIMESTAMPTZ(6),
  ALTER COLUMN updated_at TYPE TIMESTAMPTZ(6);

-- ═══════════════════════════════════════════════════════════════════════════════
-- REFRESH_TOKENS TABLE ALIGNMENT (if exists)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Add missing fields for token rotation
ALTER TABLE refresh_tokens 
  ADD COLUMN IF NOT EXISTS family_id UUID,
  ADD COLUMN IF NOT EXISTS user_agent VARCHAR(255),
  ADD COLUMN IF NOT EXISTS ip VARCHAR(45),
  ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ(6),
  ADD COLUMN IF NOT EXISTS replaced_by_id UUID;

-- Update timestamp precision
ALTER TABLE refresh_tokens 
  ALTER COLUMN created_at TYPE TIMESTAMPTZ(6),
  ALTER COLUMN expires_at TYPE TIMESTAMPTZ(6);

-- ═══════════════════════════════════════════════════════════════════════════════
-- NOTIFICATIONS TABLE ALIGNMENT
-- ═══════════════════════════════════════════════════════════════════════════════

-- Update timestamp precision
ALTER TABLE notifications 
  ALTER COLUMN created_at TYPE TIMESTAMPTZ(6);

-- Add read_at field with correct precision
ALTER TABLE notifications 
  ALTER COLUMN read_at TYPE TIMESTAMPTZ(6);

-- ═══════════════════════════════════════════════════════════════════════════════
-- AUDIT_LOGS TABLE ALIGNMENT
-- ═══════════════════════════════════════════════════════════════════════════════

-- Rename fields to match Prisma schema
ALTER TABLE audit_logs 
  RENAME COLUMN details TO details,  -- Keep as-is
  ADD COLUMN IF NOT EXISTS target_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS target_id VARCHAR(64);

-- Update timestamp precision
ALTER TABLE audit_logs 
  ALTER COLUMN created_at TYPE TIMESTAMPTZ(6);

-- ═══════════════════════════════════════════════════════════════════════════════
-- ADD MISSING INDEXES FOR NEW FIELDS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Groups indexes
CREATE INDEX IF NOT EXISTS idx_groups_owner_id ON groups(owner_id);
CREATE INDEX IF NOT EXISTS idx_groups_slug ON groups(slug);
CREATE INDEX IF NOT EXISTS idx_groups_invite_code ON groups(invite_code);
CREATE INDEX IF NOT EXISTS idx_groups_last_message_at ON groups(last_message_at DESC);

-- Group members status index
CREATE INDEX IF NOT EXISTS idx_group_members_status ON group_members(status);

-- VIP requests reviewed indexes  
CREATE INDEX IF NOT EXISTS idx_vip_requests_reviewed_by ON vip_group_requests(reviewed_by_id);
CREATE INDEX IF NOT EXISTS idx_vip_requests_reviewed_at ON vip_group_requests(reviewed_at DESC);

COMMIT;