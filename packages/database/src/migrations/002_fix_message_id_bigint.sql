-- Migration: Convert message ID from UUID to BIGINT for proper cursor pagination
-- This is required by PRD for message ordering and efficient pagination

-- Step 1: Create new messages table with BIGINT ID
CREATE TABLE messages_new (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  content TEXT,
  type VARCHAR(20) NOT NULL DEFAULT 'TEXT' CHECK (type IN ('TEXT', 'IMAGE', 'FILE', 'SYSTEM')),
  status VARCHAR(20) NOT NULL DEFAULT 'SENT' CHECK (status IN ('PENDING', 'SENT', 'FAILED', 'DELETED')),
  reply_to_id BIGINT REFERENCES messages_new(id) ON DELETE SET NULL,
  client_message_id UUID, -- For idempotency
  mentions UUID[] DEFAULT '{}',
  metadata JSONB,
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  deleted_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Step 2: Add unique constraint for idempotency (sender + client_message_id)
CREATE UNIQUE INDEX uq_messages_sender_client_id 
  ON messages_new (user_id, client_message_id) 
  WHERE client_message_id IS NOT NULL;

-- Step 3: Create indexes for performance
CREATE INDEX idx_messages_group_id_created_desc ON messages_new(group_id, id DESC);
CREATE INDEX idx_messages_user_id ON messages_new(user_id);
CREATE INDEX idx_messages_deleted ON messages_new(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX idx_messages_status ON messages_new(status);
CREATE INDEX idx_messages_reply_to ON messages_new(reply_to_id);

-- Step 4: Migrate existing data (if any exists)
-- Note: Since this is likely empty in current setup, we can skip data migration
-- If data exists, would need to map UUID references to new BIGINT IDs

-- Step 5: Update groups table to reference BIGINT message ID
ALTER TABLE groups 
  DROP COLUMN IF EXISTS last_message_id,
  ADD COLUMN last_message_id BIGINT REFERENCES messages_new(id) ON DELETE SET NULL;

-- Step 6: Drop old messages table and rename new one
DROP TABLE IF EXISTS messages CASCADE;
ALTER TABLE messages_new RENAME TO messages;

-- Step 7: Update any other tables that might reference message IDs
-- (Currently none in the schema, but good practice to check)

COMMIT;