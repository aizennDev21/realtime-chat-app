export const configuration = () => ({
  // Server
  port: parseInt(process.env.PORT, 10) || 3000,
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database
  database: {
    url: process.env.DATABASE_URL,
    queryTimeout: parseInt(process.env.DB_QUERY_TIMEOUT_MS, 10) || 30000,
  },

  // Redis
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD,
  },

  // JWT & Authentication
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'dev-access-secret',
    accessTtl: parseInt(process.env.JWT_ACCESS_TTL_SECONDS, 10) || 900, // 15 minutes
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
    refreshTtlDays: parseInt(process.env.REFRESH_TTL_DAYS, 10) || 30,
  },

  // Security
  security: {
    argon2: {
      memoryCost: parseInt(process.env.ARGON2_MEMORY_COST, 10) || 65536, // 64MB
      timeCost: parseInt(process.env.ARGON2_TIME_COST, 10) || 3,
      parallelism: parseInt(process.env.ARGON2_PARALLELISM, 10) || 4,
    },
    cookieDomain: process.env.COOKIE_DOMAIN,
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'],
  },

  // File Storage (S3/MinIO)
  storage: {
    endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
    region: process.env.S3_REGION || 'us-east-1',
    bucket: process.env.S3_BUCKET || 'kumpul-storage',
    accessKeyId: process.env.S3_ACCESS_KEY || 'minioadmin',
    secretAccessKey: process.env.S3_SECRET_KEY || 'minioadmin',
    publicBaseUrl: process.env.S3_PUBLIC_BASE_URL || 'http://localhost:9000',
  },

  // Real-time features
  realtime: {
    presenceMaxGroupSize: parseInt(process.env.PRESENCE_MAX_GROUP_SIZE, 10) || 500,
    typingTimeoutMs: parseInt(process.env.TYPING_TIMEOUT_MS, 10) || 5000,
    socketTimeoutMs: parseInt(process.env.SOCKET_TIMEOUT_MS, 10) || 30000,
  },

  // Business rules (from shared constants, configurable via env)
  limits: {
    messageMaxLength: parseInt(process.env.MESSAGE_MAX_LENGTH, 10) || 4000,
    messageEditWindowMs: parseInt(process.env.MESSAGE_EDIT_WINDOW_MS, 10) || 900000, // 15 min
    vipRequestMaxPendingPerUser: parseInt(process.env.VIP_REQUEST_MAX_PENDING, 10) || 1,
    vipRequestMaxActivePerUser: parseInt(process.env.VIP_REQUEST_MAX_ACTIVE, 10) || 3,
    vipRequestRejectionCooldownMs: parseInt(process.env.VIP_REQUEST_COOLDOWN_MS, 10) || 86400000, // 24h
    groupMemberLimitDefault: parseInt(process.env.GROUP_MEMBER_LIMIT_DEFAULT, 10) || 500,
    groupMemberLimitMax: parseInt(process.env.GROUP_MEMBER_LIMIT_MAX, 10) || 1000,
  },

  // Admin settings
  admin: {
    initialEmail: process.env.ADMIN_EMAIL,
    initialPassword: process.env.ADMIN_PASSWORD,
  },

  // Logging & Monitoring
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    prettyPrint: process.env.NODE_ENV !== 'production',
  },

  // External services
  email: {
    smtpHost: process.env.SMTP_HOST,
    smtpPort: parseInt(process.env.SMTP_PORT, 10) || 587,
    smtpUser: process.env.SMTP_USER,
    smtpPassword: process.env.SMTP_PASSWORD,
    fromAddress: process.env.EMAIL_FROM || 'noreply@kumpul.app',
  },
});