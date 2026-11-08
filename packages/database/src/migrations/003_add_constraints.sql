-- Migration: Add missing CHECK constraints and business rules
-- Based on schema.md specifications

-- ═══════════════════════════════════════════════════════════════════════════════
-- USER CONSTRAINTS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Ensure email is lowercase
ALTER TABLE users 
  ADD CONSTRAINT ck_users_email_lowercase 
  CHECK (email = lower(email));

-- Ensure username format: 3-20 chars, [a-z0-9_] only
ALTER TABLE users 
  ADD CONSTRAINT ck_users_username_format 
  CHECK (username ~ '^[a-z0-9_]{3,20}$');

-- Ensure display name length
ALTER TABLE users 
  ADD CONSTRAINT ck_users_display_name_length 
  CHECK (char_length(display_name) BETWEEN 1 AND 40);

-- ═══════════════════════════════════════════════════════════════════════════════
-- GROUP CONSTRAINTS  
-- ═══════════════════════════════════════════════════════════════════════════════

-- Ensure group name length
ALTER TABLE groups 
  ADD CONSTRAINT ck_groups_name_length 
  CHECK (char_length(name) BETWEEN 3 AND 50);

-- Ensure description length
ALTER TABLE groups 
  ADD CONSTRAINT ck_groups_description_length 
  CHECK (description IS NULL OR char_length(description) <= 500);

-- Ensure max_members is within range
ALTER TABLE groups 
  ADD CONSTRAINT ck_groups_max_members_range 
  CHECK (max_members BETWEEN 2 AND 1000);

-- Ensure member_count is valid
ALTER TABLE groups 
  ADD CONSTRAINT ck_groups_member_count_valid 
  CHECK (member_count >= 0 AND member_count <= max_members);

-- Ensure VIP groups have owner
ALTER TABLE groups 
  ADD CONSTRAINT ck_groups_vip_must_have_owner 
  CHECK (type != 'VIP' OR owner_id IS NOT NULL);

-- Ensure VIP groups have invite code
ALTER TABLE groups 
  ADD CONSTRAINT ck_groups_vip_must_have_invite_code 
  CHECK (type != 'VIP' OR invite_code IS NOT NULL);

-- ═══════════════════════════════════════════════════════════════════════════════
-- MESSAGE CONSTRAINTS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Ensure message content length (if not deleted)
ALTER TABLE messages 
  ADD CONSTRAINT ck_messages_content_length 
  CHECK (content IS NULL OR char_length(content) <= 4000);

-- Ensure TEXT messages have content (unless deleted)
ALTER TABLE messages 
  ADD CONSTRAINT ck_messages_text_has_content 
  CHECK (type != 'TEXT' OR deleted_at IS NOT NULL OR content IS NOT NULL);

-- Ensure SYSTEM messages don't have sender
ALTER TABLE messages 
  ADD CONSTRAINT ck_messages_system_no_sender 
  CHECK (type != 'SYSTEM' OR sender_id IS NULL);

-- ═══════════════════════════════════════════════════════════════════════════════
-- VIP REQUEST CONSTRAINTS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Ensure group name length
ALTER TABLE vip_group_requests 
  ADD CONSTRAINT ck_vip_requests_group_name_length 
  CHECK (char_length(group_name) BETWEEN 3 AND 50);

-- Ensure purpose length
ALTER TABLE vip_group_requests 
  ADD CONSTRAINT ck_vip_requests_purpose_length 
  CHECK (char_length(purpose) <= 1000);

-- Ensure estimated members range
ALTER TABLE vip_group_requests 
  ADD CONSTRAINT ck_vip_requests_estimated_members_range 
  CHECK (estimated_members BETWEEN 2 AND 1000);

-- Ensure approved max members range (when approved)
ALTER TABLE vip_group_requests 
  ADD CONSTRAINT ck_vip_requests_approved_max_members_range 
  CHECK (approved_max_members IS NULL OR approved_max_members BETWEEN 2 AND 1000);

-- Ensure rejection has admin notes
ALTER TABLE vip_group_requests 
  ADD CONSTRAINT ck_vip_requests_rejection_has_notes 
  CHECK (status != 'REJECTED' OR (admin_notes IS NOT NULL AND char_length(admin_notes) >= 10));

-- ═══════════════════════════════════════════════════════════════════════════════
-- NOTIFICATION CONSTRAINTS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Ensure title length
ALTER TABLE notifications 
  ADD CONSTRAINT ck_notifications_title_length 
  CHECK (char_length(title) BETWEEN 1 AND 120);

-- Ensure body length
ALTER TABLE notifications 
  ADD CONSTRAINT ck_notifications_body_length 
  CHECK (body IS NULL OR char_length(body) <= 500);

-- ═══════════════════════════════════════════════════════════════════════════════
-- INVITE CODE CONSTRAINTS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Ensure code length
ALTER TABLE invite_codes 
  ADD CONSTRAINT ck_invite_codes_code_length 
  CHECK (char_length(code) BETWEEN 6 AND 10);

-- Ensure max uses is positive
ALTER TABLE invite_codes 
  ADD CONSTRAINT ck_invite_codes_max_uses_positive 
  CHECK (max_uses IS NULL OR max_uses > 0);

-- Ensure use count is valid
ALTER TABLE invite_codes 
  ADD CONSTRAINT ck_invite_codes_use_count_valid 
  CHECK (use_count >= 0 AND (max_uses IS NULL OR use_count <= max_uses));

COMMIT;