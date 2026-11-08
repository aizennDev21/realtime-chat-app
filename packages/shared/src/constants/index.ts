// Business Rules & Configuration
export const CONFIG = {
  // Message
  MESSAGE_MIN_LENGTH: 1,
  MESSAGE_MAX_LENGTH: 4000,
  MESSAGE_EDIT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  MESSAGE_RATE_LIMIT: {
    count: 10,
    window: 10000, // 10 seconds
  },

  // User & Auth
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 20,
  USERNAME_PATTERN: /^[a-z0-9_]+$/,
  PASSWORD_MIN_LENGTH: 8,
  DISPLAY_NAME_MIN_LENGTH: 1,
  DISPLAY_NAME_MAX_LENGTH: 40,

  // Group
  GROUP_NAME_MIN_LENGTH: 3,
  GROUP_NAME_MAX_LENGTH: 50,
  GROUP_DESCRIPTION_MAX_LENGTH: 500,
  GROUP_PUBLIC_MEMBER_LIMIT: 500,
  GROUP_VIP_DEFAULT_MEMBER_LIMIT: 100,
  GROUP_VIP_MAX_MEMBER_LIMIT: 1000,

  // Files
  AVATAR_MAX_SIZE: 2 * 1024 * 1024, // 2 MB
  IMAGE_MAX_SIZE: 5 * 1024 * 1024, // 5 MB
  FILE_MAX_SIZE: 10 * 1024 * 1024, // 10 MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  ALLOWED_FILE_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],

  // VIP Request
  VIP_REQUEST_MAX_PENDING_PER_USER: 1,
  VIP_REQUEST_MAX_ACTIVE_PER_USER: 3,
  VIP_REQUEST_MIN_PURPOSE_LENGTH: 0,
  VIP_REQUEST_MAX_PURPOSE_LENGTH: 1000,
  VIP_REQUEST_REJECTION_COOLDOWN_MS: 24 * 60 * 60 * 1000, // 24 hours
  VIP_REQUEST_MIN_REJECTION_REASON_LENGTH: 10,

  // Auth Tokens
  ACCESS_TOKEN_EXPIRY: 15 * 60, // 15 minutes in seconds
  REFRESH_TOKEN_EXPIRY: 30 * 24 * 60 * 60, // 30 days in seconds
  REFRESH_TOKEN_ROTATION: true,

  // Rate Limiting
  LOGIN_RATE_LIMIT: {
    windowMs: 60 * 1000, // 1 minute
    max: 5, // 5 attempts
  },

  // WebSocket
  TYPING_INDICATOR_TIMEOUT_MS: 5000, // 5 seconds
  PRESENCE_UPDATE_INTERVAL_MS: 30000, // 30 seconds
  MAX_PRESENCE_UPDATES_PER_GROUP: 500, // For groups with > 500 members, disable presence

  // Pagination
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 100,

  // Timeouts
  DB_QUERY_TIMEOUT_MS: 30000, // 30 seconds
  SOCKET_CONNECTION_TIMEOUT_MS: 30000, // 30 seconds
}

// Error Codes
export const ERROR_CODES = {
  // Auth Errors
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
  USERNAME_ALREADY_EXISTS: 'USERNAME_ALREADY_EXISTS',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  ACCOUNT_SUSPENDED: 'ACCOUNT_SUSPENDED',
  UNAUTHORIZED: 'UNAUTHORIZED',

  // Group Errors
  GROUP_NOT_FOUND: 'GROUP_NOT_FOUND',
  GROUP_FULL: 'GROUP_FULL',
  ALREADY_MEMBER: 'ALREADY_MEMBER',
  NOT_MEMBER: 'NOT_MEMBER',
  BANNED_FROM_GROUP: 'BANNED_FROM_GROUP',
  INVALID_INVITE_CODE: 'INVALID_INVITE_CODE',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',

  // Message Errors
  MESSAGE_NOT_FOUND: 'MESSAGE_NOT_FOUND',
  MESSAGE_TOO_LONG: 'MESSAGE_TOO_LONG',
  MESSAGE_EDIT_WINDOW_EXPIRED: 'MESSAGE_EDIT_WINDOW_EXPIRED',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  // VIP Request Errors
  VIP_REQUEST_NOT_FOUND: 'VIP_REQUEST_NOT_FOUND',
  VIP_REQUEST_PENDING_EXISTS: 'VIP_REQUEST_PENDING_EXISTS',
  VIP_LIMIT_REACHED: 'VIP_LIMIT_REACHED',
  VIP_REQUEST_REJECTION_COOLDOWN: 'VIP_REQUEST_REJECTION_COOLDOWN',

  // File Errors
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',

  // Validation Errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',

  // Server Errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
}

// Socket Event Names
export const SOCKET_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',

  // Messages
  MESSAGE_SEND: 'message:send',
  MESSAGE_RECEIVE: 'message:receive',
  MESSAGE_EDIT: 'message:edit',
  MESSAGE_DELETE: 'message:delete',
  MESSAGE_HISTORY_LOAD: 'message:history:load',

  // Typing
  TYPING_START: 'typing:start',
  TYPING_STOP: 'typing:stop',
  TYPING_UPDATE: 'typing:update',

  // Presence
  PRESENCE_UPDATE: 'presence:update',
  PRESENCE_JOINED: 'presence:joined',
  PRESENCE_LEFT: 'presence:left',

  // Group Notifications
  MEMBER_JOINED: 'member:joined',
  MEMBER_LEFT: 'member:left',
  MEMBER_KICKED: 'member:kicked',
  MEMBER_BANNED: 'member:banned',
  MEMBER_ROLE_CHANGED: 'member:role:changed',

  // Group Changes
  GROUP_UPDATED: 'group:updated',
  GROUP_ARCHIVED: 'group:archived',

  // VIP Requests
  VIP_REQUEST_APPROVED: 'vip:request:approved',
  VIP_REQUEST_REJECTED: 'vip:request:rejected',

  // Notifications
  NOTIFICATION_NEW: 'notification:new',
  NOTIFICATION_MARK_READ: 'notification:mark:read',

  // Errors
  ERROR: 'error',
}

// HTTP Status Messages
export const HTTP_MESSAGES = {
  OK: 'OK',
  CREATED: 'Created',
  BAD_REQUEST: 'Bad Request',
  UNAUTHORIZED: 'Unauthorized',
  FORBIDDEN: 'Forbidden',
  NOT_FOUND: 'Not Found',
  CONFLICT: 'Conflict',
  INTERNAL_ERROR: 'Internal Server Error',
  SERVICE_UNAVAILABLE: 'Service Unavailable',
}
