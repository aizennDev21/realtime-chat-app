-- Migration: Add partial unique indexes for business rules
-- These enforce complex business logic through database constraints

-- Enable pg_trgm extension for text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ═══════════════════════════════════════════════════════════════════════════════
-- BUSINESS RULE ENFORCEMENT VIA UNIQUE PARTIAL INDEXES
-- ═══════════════════════════════════════════════════════════════════════════════

-- RULE: Maximum 1 PENDING VIP request per user
CREATE UNIQUE INDEX uq_vip_requests_one_pending_per_user
  ON vip_group_requests (requester_id) 
  WHERE status = 'PENDING';

-- RULE: Maximum 1 OWNER per group (active members only)
CREATE UNIQUE INDEX uq_group_members_one_owner_per_group
  ON group_members (group_id) 
  WHERE role = 'OWNER' AND status = 'ACTIVE';

-- RULE: One active membership per user per group (prevent duplicates)
CREATE UNIQUE INDEX uq_group_members_one_active_per_user_group
  ON group_members (group_id, user_id) 
  WHERE status = 'ACTIVE';

-- ═══════════════════════════════════════════════════════════════════════════════
-- PERFORMANCE INDEXES
-- ═══════════════════════════════════════════════════════════════════════════════

-- Fast group search by name (for Jelajah/Discovery)
CREATE INDEX idx_groups_name_search_trgm
  ON groups USING gin (lower(name) gin_trgm_ops) 
  WHERE status = 'ACTIVE' AND deleted_at IS NULL;

-- Fast lookup of VIP groups per owner (for limit enforcement)
CREATE INDEX idx_groups_vip_active_by_owner
  ON groups (owner_id) 
  WHERE type = 'VIP' AND status = 'ACTIVE' AND deleted_at IS NULL;

-- Fast unread notifications lookup
CREATE INDEX idx_notifications_unread_by_user
  ON notifications (user_id, created_at DESC) 
  WHERE read_at IS NULL;

-- Fast active group members lookup
CREATE INDEX idx_group_members_active_by_group
  ON group_members (group_id, role, joined_at DESC) 
  WHERE status = 'ACTIVE';

-- Fast user's active groups lookup (for sidebar)
CREATE INDEX idx_group_members_active_by_user
  ON group_members (user_id, joined_at DESC) 
  WHERE status = 'ACTIVE';

-- Fast message timeline for specific group
CREATE INDEX idx_messages_timeline_by_group
  ON messages (group_id, created_at DESC, id DESC) 
  WHERE deleted_at IS NULL;

-- Fast recent audit logs
CREATE INDEX idx_audit_logs_recent
  ON audit_logs (created_at DESC, actor_id, action);

-- ═══════════════════════════════════════════════════════════════════════════════
-- DATA INTEGRITY & CLEANUP INDEXES
-- ═══════════════════════════════════════════════════════════════════════════════

-- Index for cleaning up expired refresh tokens
CREATE INDEX idx_refresh_tokens_expired
  ON refresh_tokens (expires_at) 
  WHERE revoked_at IS NULL;

-- Index for cleaning up old notifications (90 days retention)
CREATE INDEX idx_notifications_cleanup
  ON notifications (created_at) 
  WHERE created_at < (CURRENT_TIMESTAMP - INTERVAL '90 days');

-- ═══════════════════════════════════════════════════════════════════════════════
-- AUDIT LOG PROTECTION (Defense in Depth)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Function to prevent audit log modification
CREATE OR REPLACE FUNCTION prevent_audit_log_modification() 
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are append-only and cannot be modified or deleted';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce append-only audit logs
DROP TRIGGER IF EXISTS trg_audit_logs_append_only ON audit_logs;
CREATE TRIGGER trg_audit_logs_append_only
  BEFORE UPDATE OR DELETE ON audit_logs
  FOR EACH ROW 
  EXECUTE FUNCTION prevent_audit_log_modification();

COMMIT;