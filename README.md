# RCT (Real-time Chat Technology) - Group Chat Application

RCT adalah aplikasi chat berbasis web untuk percakapan grup secara realtime dengan dukungan admin management, VIP groups, dan fitur moderasi.

## 📋 Tech Stack

### Backend
- **Runtime**: Node.js with Express
- **Language**: TypeScript
- **Database**: PostgreSQL 16
- **Cache**: Redis 7
- **Real-time**: Socket.IO
- **File Storage**: MinIO (S3-compatible)

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Real-time**: Socket.IO Client

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- npm or yarn (workspaces support)

### Setup

1. **Clone dan install dependencies**
   ```bash
   npm install
   ```

2. **Setup environment variables**
   ```bash
   cp .env.example .env.local
   ```

3. **Start Docker services (PostgreSQL, Redis, MinIO)**
   ```bash
   npm run docker:up
   ```

4. **Run database migrations**
   ```bash
   npm run db:migrate
   ```

5. **Seed admin user (opsional)**
   ```bash
   npm run db:seed
   ```

6. **Start development servers**
   
   Terminal 1 - Backend:
   ```bash
   npm run backend
   ```
   
   Terminal 2 - Frontend:
   ```bash
   npm run frontend
   ```

   Atau keduanya:
   ```bash
   npm run dev
   ```

### Akses Aplikasi
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api
- **MinIO Console**: http://localhost:9001 (user: minioadmin, pass: minioadmin)

## 📁 Project Structure

```
kumpul-monorepo/
├── apps/
│   ├── backend/          # Express + Socket.IO backend
│   │   ├── src/
│   │   ├── tsconfig.json
│   │   └── package.json
│   └── frontend/         # React + Vite frontend
│       ├── src/
│       ├── vite.config.ts
│       └── package.json
├── packages/
│   ├── shared/           # Shared types, constants, utilities
│   │   └── src/
│   └── database/         # Database migrations & seeds
│       └── src/
├── docker-compose.yml    # Local development services
└── package.json          # Root workspace configuration
```

## 🛠️ Available Commands

### Root Commands
```bash
npm run dev              # Start all dev servers
npm run build            # Build all packages
npm run test             # Run tests in all packages
npm run lint             # Lint all packages
npm run docker:up        # Start Docker services
npm run docker:down      # Stop Docker services
npm run db:migrate       # Run database migrations
npm run db:seed          # Seed database with initial data
```

### Backend Commands
```bash
npm run backend          # Start backend dev server
npm run build -w @kumpul/backend
npm run test -w @kumpul/backend
npm run lint -w @kumpul/backend
```

### Frontend Commands
```bash
npm run frontend         # Start frontend dev server
npm run build -w @kumpul/frontend
npm run preview -w @kumpul/frontend
npm run lint -w @kumpul/frontend
```

## 📚 Documentation

- [PRD (Product Requirements)](./context/PRD.md) - Spesifikasi produk lengkap
- [Architecture](./context/architecture.md) - Arsitektur teknis
- [Design](./context/Design.md) - UI/UX design
- [Database Schema](./context/schema.md) - Database design
- [Business Rules](./context/rules.md) - Business rules & constraints

## 🔑 Key Features

### User Management
- ✅ Register & Login with email/password
- ✅ Profile management (display name, avatar)
- ✅ User roles (USER, ADMIN)
- ✅ Account suspension

### Group Chat
- ✅ Public groups (discoverable)
- ✅ VIP groups (invite-only)
- ✅ Real-time messaging
- ✅ Message editing & deletion
- ✅ Typing indicators
- ✅ Online status
- ✅ Unread message badges

### VIP Group Requests
- ✅ User can request VIP group creation
- ✅ Admin review & approve/reject
- ✅ Automatic group creation on approval
- ✅ Invitation code generation

### Admin Panel
- ✅ Dashboard overview
- ✅ Group management
- ✅ User management
- ✅ VIP request review
- ✅ Audit logging

### Moderation
- ✅ Member kick/ban
- ✅ Message deletion
- ✅ Role management
- ✅ Audit logs

## 🔐 Security

- Password hashing dengan Argon2id
- JWT dengan access + refresh tokens
- Token rotation untuk refresh tokens
- Rate limiting pada auth endpoints
- CORS configuration
- Input validation & sanitization
- Authorization checks pada setiap endpoint & WebSocket handler

## 📊 Performance Targets

- Message delivery latency (p95): < 300ms
- Message delivery success rate: ≥ 99.5%
- Concurrent connections per instance: ≥ 1,000
- API error rate (5xx): < 1%

## 🚢 Deployment

### Development
Services berjalan di Docker Compose locally.

### Production
- Frontend: Deploy ke static hosting (Vercel, Netlify, etc.)
- Backend: Deploy ke container orchestration (Kubernetes, ECS, etc.)
- Database: Managed PostgreSQL service
- Cache: Managed Redis service
- Storage: S3 atau compatible service

## 📝 Environment Variables

Lihat `.env.example` untuk daftar lengkap environment variables yang diperlukan.

## 🐛 Troubleshooting

### Database connection failed
- Pastikan PostgreSQL container berjalan: `docker ps`
- Check connection string di `.env.local`

### Redis connection failed
- Pastikan Redis container berjalan
- Check REDIS_URL di `.env.local`

### Port already in use
- Backend (3000): `lsof -i :3000`
- Frontend (5173): `lsof -i :5173`
- PostgreSQL (5432): `lsof -i :5432`

## 📄 License

MIT License

## 👥 Contributors

- Development Team

---

**Last Updated**: September 2026
