// User Types
export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export interface User {
  id: string
  email: string
  username: string
  display_name: string
  avatar_url?: string
  role: UserRole
  status: UserStatus
  created_at: string
  updated_at: string
}

// Group Types
export enum GroupType {
  PUBLIC = 'PUBLIC',
  VIP = 'VIP',
}

export enum GroupStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
  DELETED = 'DELETED',
}

export interface Group {
  id: string
  name: string
  description: string
  type: GroupType
  status: GroupStatus
  avatar_url?: string
  member_limit: number
  member_count: number
  created_at: string
  updated_at: string
}

// Group Member Types
export enum GroupMemberRole {
  MEMBER = 'MEMBER',
  MODERATOR = 'MODERATOR',
  OWNER = 'OWNER',
}

export interface GroupMember {
  id: string
  group_id: string
  user_id: string
  role: GroupMemberRole
  joined_at: string
  is_banned: boolean
  banned_at?: string
}

// Message Types
export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  FILE = 'FILE',
  SYSTEM = 'SYSTEM',
}

export enum MessageStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  DELETED = 'DELETED',
}

export interface Message {
  id: string
  group_id: string
  user_id: string
  content: string
  type: MessageType
  status: MessageStatus
  reply_to_id?: string
  edited_at?: string
  deleted_at?: string
  deleted_by_id?: string
  created_at: string
}

// VIP Request Types
export enum VIPRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export interface VIPRequest {
  id: string
  user_id: string
  group_name: string
  description: string
  purpose: string
  estimated_members: number
  status: VIPRequestStatus
  admin_notes?: string
  created_at: string
  updated_at: string
  processed_at?: string
  processed_by_id?: string
}

// Invite Code Types
export interface InviteCode {
  id: string
  group_id: string
  code: string
  created_by_id: string
  created_at: string
  expires_at?: string
  max_uses?: number
  use_count: number
}

// Audit Log Types
export enum AuditLogAction {
  USER_CREATED = 'USER_CREATED',
  USER_SUSPENDED = 'USER_SUSPENDED',
  USER_ROLE_CHANGED = 'USER_ROLE_CHANGED',
  GROUP_CREATED = 'GROUP_CREATED',
  GROUP_UPDATED = 'GROUP_UPDATED',
  GROUP_ARCHIVED = 'GROUP_ARCHIVED',
  GROUP_DELETED = 'GROUP_DELETED',
  MEMBER_ADDED = 'MEMBER_ADDED',
  MEMBER_REMOVED = 'MEMBER_REMOVED',
  MEMBER_BANNED = 'MEMBER_BANNED',
  MEMBER_ROLE_CHANGED = 'MEMBER_ROLE_CHANGED',
  MESSAGE_DELETED = 'MESSAGE_DELETED',
  VIP_REQUEST_APPROVED = 'VIP_REQUEST_APPROVED',
  VIP_REQUEST_REJECTED = 'VIP_REQUEST_REJECTED',
}

export interface AuditLog {
  id: string
  action: AuditLogAction
  actor_id: string
  target_id?: string
  target_type?: string
  details?: Record<string, unknown>
  ip_address?: string
  created_at: string
}

// Socket Event Types
export interface TypingIndicator {
  group_id: string
  user_id: string
  username: string
  timestamp: string
}

export interface OnlineStatus {
  user_id: string
  is_online: boolean
  timestamp: string
}

// API Response Types
export interface APIResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
}

// Pagination
export interface PaginationCursor {
  limit: number
  after?: string
  before?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  cursor: {
    hasNext: boolean
    hasPrev: boolean
    nextCursor?: string
    prevCursor?: string
  }
}
