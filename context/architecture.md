# architecture — Arsitektur Kumpul

> Dokumen terkait: [PRD.md](./PRD.md) · [Design.md](./Design.md) · [rules.md](./rules.md) · [schema.md](./schema.md)

---

## 1. Ringkasan

Kumpul dibangun sebagai **monorepo** dengan dua aplikasi yang **terpisah dan dapat di-deploy sendiri-sendiri**:

- `apps/frontend` — antarmuka web (Next.js).
- `apps/backend` — **modular monolith** NestJS yang melayani REST API **dan** gateway WebSocket (Socket.IO) dalam satu proses.

Keduanya hanya berkomunikasi lewat HTTP dan WebSocket; kontrak (tipe, skema zod, kode error, nama event) dibagi lewat `packages/shared`.

**Prinsip arsitektur**

1. **Server adalah sumber kebenaran** (validasi, otorisasi, urutan pesan).
2. **Stateless backend** → bisa di-scale horizontal; state ephemeral (presence, typing, rate limit) di Redis.
3. **Pesan idempoten & dapat dipulihkan** (ack + `clientMessageId` + sinkronisasi kursor saat reconnect).
4. **Otorisasi berlapis**: guard global → policy per domain → pemeriksaan keanggotaan di setiap event socket.
5. **Mulai sederhana**: satu backend, satu database, satu Redis. Pecah layanan hanya bila ada bukti kebutuhan.

---

## 2. Tech stack

| Lapisan | Pilihan | Alasan singkat |
|---|---|---|
| Monorepo | pnpm workspaces + Turborepo | Instalasi cepat, cache build, batas paket jelas |
| Bahasa | TypeScript (strict) | Kontrak tipe end-to-end |
| Frontend | **Next.js** (App Router) + React | Routing, middleware proteksi rute, ekosistem |
| UI | Tailwind CSS + shadcn/ui (Radix) | Token-driven, aksesibel |
| State FE | TanStack Query (data server) + Zustand (UI/ephemeral) | Pemisahan tanggung jawab jelas |
| Daftar pesan | TanStack Virtual | Virtualisasi ribuan pesan |
| Form/validasi | react-hook-form + **zod** (dibagi dengan BE) | Satu skema, dua sisi |
| Realtime | **Socket.IO** (client & server) + `@socket.io/redis-adapter` | Reconnect otomatis, room, ack, scale via Redis |
| Backend | **NestJS** (Node.js LTS) | Modular, DI, guard/pipe/interceptor, dukungan gateway |
| ORM & DB | **Prisma** + **PostgreSQL** | Migrasi terkelola, transaksi, indeks, constraint parsial |
| Cache/ephemeral | **Redis** | Presence, typing, rate limit, pub/sub adapter |
| File | S3-compatible (MinIO untuk lokal) | Presigned upload, tidak membebani API |
| Auth | JWT access (pendek) + refresh token berputar (cookie httpOnly), Argon2id | Aman & mendukung multi-perangkat |
| Logging | pino (nestjs-pino) | Log JSON terstruktur |
| Tes | Jest + Supertest (BE), Vitest + Testing Library (FE), Playwright (E2E), k6 (beban) | Lihat rules.md §9 |
| CI/CD | GitHub Actions | Lint, typecheck, test, build, image Docker |
| Kontainer | Docker (+ Compose untuk lokal) | Paritas lingkungan |

> Versi spesifik dikunci di `package.json`/lockfile dan `.nvmrc`; gunakan versi LTS/stable terbaru saat scaffolding.

---

## 3. Arsitektur tingkat tinggi

```mermaid
flowchart LR
  subgraph Browser
    FE["Next.js app<br/>(apps/frontend)"]
  end

  subgraph Backend["apps/backend (NestJS)"]
    API["REST API /api/v1"]
    WS["Socket.IO Gateway /chat"]
    SVC["Domain services<br/>auth, groups, members, messages,<br/>vip-requests, notifications, admin"]
  end

  PG[("PostgreSQL")]
  RD[("Redis")]
  S3[("S3 / MinIO")]

  FE -- "HTTPS (REST, cookie refresh)" --> API
  FE -- "WebSocket (auth token)" --> WS
  API --> SVC
  WS --> SVC
  SVC --> PG
  SVC --> RD
  WS <-- "adapter pub/sub" --> RD
  FE -- "PUT presigned URL" --> S3
  SVC -- "presign / verify" --> S3
```

### 3.1 Topologi deployment (produksi)

```mermaid
flowchart TB
  U["Pengguna"] --> P["Reverse proxy (Caddy/Nginx)<br/>TLS, HTTP/2, upgrade WebSocket"]
  P --> F["frontend x N<br/>app.contoh.id"]
  P --> B1["backend #1<br/>api.contoh.id"]
  P --> B2["backend #2"]
  B1 <--> R[("Redis")]
  B2 <--> R
  B1 --> D[("PostgreSQL")]
  B2 --> D
  B1 --> O[("Object storage")]
```

- FE dan BE berada pada **site yang sama** (`app.` dan `api.` di bawah domain yang sama) sehingga cookie refresh (`SameSite=Lax`) tetap terkirim pada request `fetch` dengan `credentials: "include"`.
- Transport Socket.IO **dibatasi ke `websocket`** (tanpa long-polling) sehingga **tidak memerlukan sticky session**. Bila polling diaktifkan, aktifkan sticky session di proxy.

---

## 4. Struktur kode

Struktur monorepo lengkap dan aturan dependensi ada di [rules.md §2](./rules.md). Ringkasan modul:

### 4.1 Backend (`apps/backend/src/modules`)

| Modul | Tanggung jawab |
|---|---|
| `auth` | Register, login, refresh (rotasi + deteksi reuse), logout, guard JWT |
| `users` | Profil, ganti password, profil publik |
| `groups` | CRUD grup (Admin), penemuan grup publik, gabung/keluar, kode undangan VIP, daftar "grup saya" + unread |
| `members` | Daftar anggota, ubah peran, kick/ban/unban, mute preferensi |
| `messages` | Riwayat (kursor), kirim/edit/hapus, penandaan baca, mention |
| `vip-requests` | Ajukan, batalkan, daftar milik sendiri; approve/reject (Admin) dalam transaksi |
| `notifications` | Simpan & kirim notifikasi in-app |
| `uploads` | Presign, verifikasi, pembersihan lampiran yatim |
| `admin` | Statistik dashboard, manajemen user/grup (mengorkestrasi service lain) |
| `audit` | Penulisan & pembacaan audit log |
| `realtime` | Gateway `/chat`, autentikasi socket, manajemen room, presence, typing, `RealtimePublisher` |

`RealtimePublisher` adalah satu-satunya pintu keluar untuk memancarkan event ke klien (service memanggilnya **setelah commit** transaksi).

### 4.2 Frontend (`apps/frontend/src`)

- `app/` — rute: `(auth)/login|register`, `(app)/chat|discover|vip|settings|join/[code]`, `(admin)/admin/*`.
- `features/<domain>` — komponen, hooks, klien API per domain.
- `lib/socket-client.ts` — **satu** koneksi Socket.IO; `SocketProvider` mendengarkan event dan memperbarui cache TanStack Query (`setQueryData`/`invalidateQueries`) serta store Zustand (koneksi, typing).
- `middleware.ts` — pengalihan rute privat/admin (UX saja; keamanan tetap di BE).

---

## 5. Autentikasi & sesi

```mermaid
sequenceDiagram
  participant C as Client
  participant A as API (auth)
  participant DB as PostgreSQL
  C->>A: POST /auth/login {email, password}
  A->>DB: cek user + verifikasi Argon2id
  A->>DB: simpan refresh token (hash), family baru
  A-->>C: 200 {accessToken} + Set-Cookie refresh (httpOnly)
  Note over C: accessToken disimpan di memori (15 menit)
  C->>A: GET /api/... (Authorization: Bearer)
  A-->>C: 401 AUTH_TOKEN_EXPIRED
  C->>A: POST /auth/refresh (cookie)
  A->>DB: validasi hash, tandai lama revoked, buat baru (family sama)
  A-->>C: 200 {accessToken} + cookie baru
```

- **Access token**: JWT (`sub`, `role`, `sid`, `exp` 15 menit), ditandatangani HS256/EdDSA dengan secret dari env.
- **Refresh token**: string acak 256-bit; DB hanya menyimpan **hash**. Setiap penggunaan → rotasi. Bila token yang sudah `revoked` dipakai lagi → **seluruh family dicabut** (indikasi pencurian).
- **Logout** mencabut token; **ganti password/suspend** mencabut semua sesi pengguna.
- **Socket**: token dikirim pada handshake `auth: { token }`. Peran & status pengguna dimuat ulang dari DB saat sambung.
- **Token socket kedaluwarsa**: server memeriksa `socket.data.exp` pada setiap event masuk; bila lewat → ack `AUTH_TOKEN_EXPIRED`. Klien melakukan refresh lalu mengirim `auth:refresh { token }` dan mengulang aksinya. Bila tidak diperbarui dalam 60 detik setelah kedaluwarsa, server memutus koneksi.

---

## 6. Desain realtime

### 6.1 Koneksi & room

Namespace: `/chat`. Saat sambungan berhasil (setelah autentikasi):

1. Server memuat pengguna (`status = ACTIVE`) dan keanggotaan `ACTIVE` miliknya.
2. Socket otomatis bergabung ke room:
   - `user:{userId}` — event personal (notifikasi, status pengajuan, dikeluarkan, sinkron multi-perangkat),
   - `group:{groupId}` — untuk **setiap grup aktif** milik pengguna (pesan, typing, presence, perubahan anggota),
   - `admins` — hanya untuk `role = ADMIN` (pengajuan VIP baru).
3. Presence diperbarui (6.4).

Klien **tidak** perlu mengirim event "join room". Saat keanggotaan berubah lewat REST (gabung/keluar/kick/ban/arsip), server memanggil `socketsJoin`/`socketsLeave` pada room `user:{id}` sehingga berlaku ke **semua perangkat** dan semua instance (via Redis adapter).

### 6.2 Event klien → server

Semua event pengubah state **mengembalikan ack** `{ ok: true, data } | { ok: false, error: { code, message } }`.

| Event | Payload | Ack `data` | Catatan |
|---|---|---|---|
| `message:send` | `{ groupId, clientMessageId, content?, replyToId?, attachmentIds? }` | `MessageDTO` | Idempoten per `(senderId, clientMessageId)`. Cek anggota `ACTIVE`, grup tidak diarsipkan, rate limit, panjang 1–4.000. |
| `message:edit` | `{ messageId, content }` | `MessageDTO` | Hanya pengirim, ≤ 15 menit, belum dihapus. |
| `message:delete` | `{ messageId }` | `{ messageId }` | Pengirim, atau Moderator/Owner/Admin (dicatat di audit log). |
| `typing:start` / `typing:stop` | `{ groupId }` | — | Ephemeral, tidak disimpan. Di-throttle server (1 per 2 detik per user/grup). |
| `group:read` | `{ groupId, lastReadMessageId }` | `{ unreadCount }` | Memajukan `last_read_message_id` (hanya maju, tidak mundur). |
| `auth:refresh` | `{ token }` | `{ exp }` | Memperbarui token pada koneksi yang sedang berjalan. |

### 6.3 Event server → klien

| Event | Room tujuan | Payload | Pemicu |
|---|---|---|---|
| `message:new` | `group:{id}` | `MessageDTO` | Pesan baru (termasuk pesan `SYSTEM`) |
| `message:updated` | `group:{id}` | `MessageDTO` | Pesan diedit |
| `message:deleted` | `group:{id}` | `{ messageId, groupId, deletedBy: "AUTHOR" \| "MODERATOR" }` | Pesan dihapus |
| `typing:update` | `group:{id}` (kecuali pengirim) | `{ groupId, userId, displayName, isTyping }` | `typing:*` |
| `presence:update` | `group:{id}` | `{ userId, online, lastSeenAt? }` | Perubahan online/offline (grup ≤ 500 anggota) |
| `group:updated` | `group:{id}` | `GroupDTO` (parsial) | Nama/deskripsi/avatar/status berubah, diarsipkan |
| `group:member_joined` | `group:{id}` | `{ groupId, member }` | Anggota masuk |
| `group:member_left` | `group:{id}` | `{ groupId, userId, reason: "LEFT" \| "KICKED" \| "BANNED" }` | Anggota keluar/dikeluarkan |
| `group:member_role_changed` | `group:{id}` | `{ groupId, userId, role }` | Peran diubah |
| `group:removed` | `user:{id}` | `{ groupId, reason: "KICKED" \| "BANNED" \| "ARCHIVED" \| "DELETED" }` | Pengguna kehilangan akses |
| `group:read_updated` | `user:{id}` | `{ groupId, lastReadMessageId, unreadCount }` | Sinkron baca antar-perangkat |
| `notification:new` | `user:{id}` | `NotificationDTO` | Notifikasi baru |
| `vip_request:updated` | `user:{requesterId}` dan `admins` | `VipRequestDTO` | Status pengajuan berubah / pengajuan baru |
| `error` | socket | `{ code, message }` | Kesalahan tak terikat ack |

### 6.4 Presence & typing

- **Presence**: Redis `SET presence:user:{userId}` berisi `socketId` aktif (TTL disegarkan oleh heartbeat Socket.IO). Online = set tidak kosong. Saat set menjadi kosong, tunggu **10 detik** (grace, menghindari kedip saat reload) lalu tandai offline, perbarui `users.last_seen_at`, dan pancarkan `presence:update`.
- Snapshot presence disertakan pada `GET /groups/:id/members` (`online: boolean`); pembaruan live lewat `presence:update`. Untuk grup di atas `PRESENCE_MAX_GROUP_SIZE` (default 500) siaran live dimatikan.
- **Typing**: tidak disimpan di DB. Klien mengirim `typing:start` (di-*debounce* saat mengetik) dan `typing:stop`; klien lawan menghapus indikator otomatis setelah 5 detik tanpa pembaruan.

### 6.5 Reconnect & sinkronisasi

Klien menyimpan `lastMessageId` per grup yang sedang dimuat. Saat `connect` ulang:

1. Ambil `GET /groups/mine` (unread, pesan terakhir) untuk menyegarkan sidebar.
2. Untuk grup yang terbuka: `GET /groups/:id/messages?after=<lastMessageId>` dan gabungkan (dedupe berdasarkan `id`/`clientMessageId`).
3. Pesan berstatus *mengirim/gagal* di antrean lokal dikirim ulang dengan `clientMessageId` yang sama.

Karena pengiriman idempoten dan `id` pesan monoton, urutan tidak rusak dan tidak ada pesan ganda.

### 6.6 Kirim pesan — urutan proses

```mermaid
sequenceDiagram
  participant A as Client A (pengirim)
  participant G as Gateway /chat
  participant S as MessagesService
  participant DB as PostgreSQL
  participant R as Redis adapter
  participant B as Client B (anggota lain)

  A->>A: tampilkan optimistic (status: mengirim)
  A->>G: message:send {groupId, clientMessageId, content}
  G->>G: validasi zod, cek token, rate limit
  G->>S: createMessage(user, payload)
  S->>DB: cek keanggotaan ACTIVE + grup ACTIVE
  S->>DB: INSERT messages (unique sender+clientMessageId)
  S->>DB: UPDATE groups.last_message_id/at (transaksi sama)
  DB-->>S: baris pesan (id bigint)
  S-->>G: MessageDTO
  G-->>A: ack {ok: true, data: MessageDTO}
  G->>R: emit ke room group:{id}
  R-->>B: message:new
  Note over A: status berubah menjadi terkirim
```

### 6.7 Perubahan keanggotaan (kick / ban / arsip)

1. Service memperbarui DB (status anggota, `member_count`, audit log) dalam satu transaksi.
2. Setelah commit: `socketsLeave("group:{id}")` untuk semua socket milik pengguna target → **akses berhenti seketika**.
3. Emit `group:removed` ke `user:{target}`, `group:member_left` ke `group:{id}`, dan buat notifikasi `REMOVED_FROM_GROUP`.
4. Bila pengguna di-*suspend*: `disconnectSockets` pada `user:{id}` dan semua refresh token dicabut.

---

## 7. Alur kunci: persetujuan pengajuan VIP

```mermaid
sequenceDiagram
  participant Ad as Admin (FE)
  participant API as VipRequestsService
  participant DB as PostgreSQL
  participant RT as RealtimePublisher
  participant U as Pemohon (FE)

  Ad->>API: POST /admin/vip-requests/:id/approve {maxMembers}
  API->>DB: BEGIN
  API->>DB: SELECT request FOR UPDATE (harus PENDING)
  API->>DB: hitung grup VIP aktif milik pemohon (< batas)
  API->>DB: INSERT groups (type VIP, owner, invite_code, max_members)
  API->>DB: INSERT group_members (OWNER) + member_count = 1
  API->>DB: INSERT messages (SYSTEM: grup dibuat)
  API->>DB: UPDATE request -> APPROVED (reviewed_by, created_group_id)
  API->>DB: INSERT notifications + audit_logs
  API->>DB: COMMIT
  API->>RT: socketsJoin(user:pemohon -> group:id)
  RT-->>U: vip_request:updated + notification:new
  RT-->>Ad: vip_request:updated (admins room)
  API-->>Ad: 200 {request, group}
```

Jaminan: pemrosesan **atomik** dan **tidak dapat dilakukan dua kali** (baris dikunci + pemeriksaan status). Pengajuan `PENDING` per pemohon dijaga juga oleh **unique index parsial** di DB (lihat schema.md).

Pola pancaran: event dikirim **setelah commit**. Jika pancaran gagal, data tetap konsisten di DB dan klien pulih lewat notifikasi/`GET` saat memuat ulang. (Bila dibutuhkan jaminan lebih kuat: *transactional outbox* — lihat ADR-006.)

---

## 8. Kontrak REST API (`/api/v1`)

Format error, paginasi, dan kode status: lihat [rules.md §5.6](./rules.md). Kolom **Akses**: 🌐 publik · 🔑 login · 🛡️ Admin · 👥 dengan syarat peran grup.

### 8.1 Auth & pengguna

| Metode | Path | Akses | Keterangan |
|---|---|:-:|---|
| POST | `/auth/register` | 🌐 | Daftar; mengembalikan access token + cookie refresh |
| POST | `/auth/login` | 🌐 | Masuk |
| POST | `/auth/refresh` | 🌐 (cookie) | Rotasi refresh token |
| POST | `/auth/logout` | 🔑 | Cabut sesi saat ini |
| GET | `/users/me` | 🔑 | Profil sendiri |
| PATCH | `/users/me` | 🔑 | Ubah `displayName`, `avatarAttachmentId` |
| PATCH | `/users/me/password` | 🔑 | Ganti password (cabut sesi lain) |
| GET | `/users/:id` | 🔑 | Profil publik singkat |

### 8.2 Grup & keanggotaan

| Metode | Path | Akses | Keterangan |
|---|---|:-:|---|
| GET | `/groups/discover?query=&cursor=` | 🔑 | Grup PUBLIC aktif (paginasi kursor) |
| GET | `/groups/mine` | 🔑 | Grup saya + pesan terakhir + `unreadCount` + preferensi mute |
| GET | `/groups/:id` | 👥 anggota / Admin | Detail grup (VIP hanya untuk anggota/Admin) |
| POST | `/groups/:id/join` | 🔑 | Gabung grup PUBLIC |
| POST | `/groups/join-by-code` | 🔑 | Body `{ code }`; gabung grup VIP |
| GET | `/groups/preview-by-code/:code` | 🔑 | Pratinjau grup VIP untuk halaman `/join/[code]` (data minimal) |
| POST | `/groups/:id/leave` | 👥 anggota | Keluar |
| PATCH | `/groups/:id` | 👥 Owner / 🛡️ | Ubah nama, deskripsi, avatar |
| POST | `/groups/:id/invite-code/regenerate` | 👥 Owner / 🛡️ | Kode undangan baru (yang lama tidak berlaku) |
| PATCH | `/groups/:id/membership` | 👥 anggota | Preferensi sendiri (`isMuted`) |
| GET | `/groups/:id/members?cursor=` | 👥 anggota | Daftar anggota + `online` |
| PATCH | `/groups/:id/members/:userId` | 👥 Owner / 🛡️ | Ubah peran (`MODERATOR` / `MEMBER`) |
| DELETE | `/groups/:id/members/:userId` | 👥 Moderator+ / 🛡️ | Kick |
| POST | `/groups/:id/members/:userId/ban` | 👥 Moderator+ / 🛡️ | Ban (body `{ reason? }`) |
| POST | `/groups/:id/members/:userId/unban` | 👥 Owner / 🛡️ | Cabut ban |

### 8.3 Pesan & unggahan

| Metode | Path | Akses | Keterangan |
|---|---|:-:|---|
| GET | `/groups/:id/messages?before=&after=&limit=` | 👥 anggota | Riwayat (kursor `id`, default 50, maks 100) |
| PATCH | `/messages/:id` | 👥 pengirim | Edit (≤ 15 menit) — setara `message:edit` |
| DELETE | `/messages/:id` | 👥 pengirim / Moderator+ / 🛡️ | Hapus — setara `message:delete` |
| POST | `/groups/:id/read` | 👥 anggota | Body `{ lastReadMessageId }` — setara `group:read` |
| POST | `/uploads/presign` | 🔑 | Minta URL unggah (lihat §9) |
| POST | `/uploads/:id/complete` | 🔑 | Verifikasi unggahan selesai |

> Kirim pesan dilakukan **lewat WebSocket** (`message:send`). Endpoint REST edit/hapus/baca disediakan sebagai jalur alternatif yang memakai service yang sama.

### 8.4 Pengajuan VIP & notifikasi

| Metode | Path | Akses | Keterangan |
|---|---|:-:|---|
| POST | `/vip-requests` | 🔑 | Ajukan (`groupName`, `description`, `purpose`, `expectedMembers`) |
| GET | `/vip-requests/mine` | 🔑 | Daftar pengajuan sendiri |
| POST | `/vip-requests/:id/cancel` | 🔑 (pemilik) | Batalkan bila `PENDING` |
| GET | `/notifications?cursor=&unreadOnly=` | 🔑 | Daftar notifikasi |
| POST | `/notifications/read` | 🔑 | Body `{ ids?: string[], all?: boolean }` |

### 8.5 Admin

| Metode | Path | Keterangan |
|---|---|---|
| GET | `/admin/stats` | Total user, online, grup (publik/VIP), pengajuan pending, pesan 24 jam, seri pesan 7 hari |
| GET | `/admin/users?query=&status=&cursor=` | Daftar pengguna |
| PATCH | `/admin/users/:id` | Ubah `status` (`ACTIVE`/`SUSPENDED`) atau `role` |
| GET | `/admin/groups?query=&type=&status=&cursor=` | Semua grup |
| POST | `/admin/groups` | Buat grup PUBLIC atau VIP (VIP wajib `ownerId`) |
| PATCH | `/admin/groups/:id` | Ubah info & `maxMembers` |
| POST | `/admin/groups/:id/archive` · `/restore` | Arsipkan / pulihkan |
| DELETE | `/admin/groups/:id` | Soft delete |
| POST | `/admin/groups/:id/announce` | Kirim pesan `SYSTEM` (pengumuman) |
| GET | `/admin/vip-requests?status=&cursor=` | Antrian pengajuan |
| POST | `/admin/vip-requests/:id/approve` | Body `{ maxMembers? }` — transaksi §7 |
| POST | `/admin/vip-requests/:id/reject` | Body `{ note }` (≥ 10 karakter) |
| GET | `/admin/audit-logs?actorId=&action=&from=&to=&cursor=` | Audit log |

Semua endpoint `/admin/*` dijaga `@Roles(Role.ADMIN)`; setiap aksi pengubah menulis **audit log** dalam transaksi yang sama.

### 8.6 Kode error utama

`VALIDATION_ERROR` · `AUTH_INVALID_CREDENTIALS` · `AUTH_TOKEN_EXPIRED` · `AUTH_ACCOUNT_SUSPENDED` · `FORBIDDEN` · `NOT_FOUND` · `RATE_LIMITED` · `GROUP_FULL` · `GROUP_ARCHIVED` · `ALREADY_MEMBER` · `NOT_A_MEMBER` · `BANNED_FROM_GROUP` · `INVALID_INVITE_CODE` · `OWNER_CANNOT_LEAVE` · `MESSAGE_EDIT_WINDOW_EXPIRED` · `VIP_REQUEST_PENDING_EXISTS` · `VIP_REQUEST_COOLDOWN` · `VIP_LIMIT_REACHED` · `VIP_REQUEST_NOT_PENDING` · `UPLOAD_INVALID_TYPE` · `UPLOAD_TOO_LARGE`. Didefinisikan tunggal di `packages/shared/errors.ts`.

### 8.7 DTO inti (di `packages/shared`)

```ts
export interface UserSummaryDTO {
  id: string; username: string; displayName: string; avatarUrl: string | null;
}

export interface AttachmentDTO {
  id: string; mimeType: string; sizeBytes: number;
  width: number | null; height: number | null;
  originalName: string | null; url: string;            // presigned GET, berumur pendek
}

export interface MessageDTO {
  id: string;                                            // BigInt sebagai string
  groupId: string;
  clientMessageId: string | null;
  type: "TEXT" | "IMAGE" | "FILE" | "SYSTEM";
  content: string | null;                                // null jika dihapus
  sender: UserSummaryDTO | null;                         // null untuk SYSTEM
  replyTo: { id: string; sender: UserSummaryDTO | null; snippet: string } | null;
  attachments: AttachmentDTO[];
  mentions: string[];                                    // userId
  editedAt: string | null; deletedAt: string | null; createdAt: string; // ISO UTC
  deletedBy: "AUTHOR" | "MODERATOR" | null;
}

export interface GroupDTO {
  id: string; name: string; slug: string; description: string | null;
  avatarUrl: string | null; type: "PUBLIC" | "VIP"; status: "ACTIVE" | "ARCHIVED";
  memberCount: number; maxMembers: number;
  myRole?: "OWNER" | "MODERATOR" | "MEMBER"; unreadCount?: number; isMuted?: boolean;
  inviteCode?: string;                                   // hanya untuk Owner/Admin
}
```

---

## 9. Unggahan file

```mermaid
sequenceDiagram
  participant C as Client
  participant API as Uploads API
  participant S3 as Object storage
  C->>API: POST /uploads/presign {purpose, groupId?, mimeType, sizeBytes, filename}
  API->>API: validasi tipe (whitelist), ukuran, keanggotaan, rate limit
  API-->>C: {attachmentId, uploadUrl, headers, expiresIn}
  C->>S3: PUT file (langsung, tanpa lewat API)
  C->>API: POST /uploads/:id/complete
  API->>S3: HEAD objek (verifikasi ukuran & tipe)
  API-->>C: 200 {attachmentId, status: READY}
  C->>API: message:send {attachmentIds:[...]} (via socket)
```

- `purpose`: `MESSAGE` · `USER_AVATAR` · `GROUP_AVATAR`.
- Kunci objek: `messages/{groupId}/{uuid}.{ext}` (privat, diakses lewat presigned GET) dan `avatars/{uuid}.{ext}` (publik-baca).
- Lampiran yang tidak dipakai (`message_id` null dan bukan avatar) lebih dari 24 jam dibersihkan oleh job terjadwal.
- Avatar diterapkan dengan menyebut `avatarAttachmentId` (bukan URL dari klien) agar tidak dapat diarahkan ke sumber sembarang.

---

## 10. Keamanan (ringkasan arsitektural)

Checklist rinci ada di [rules.md §8](./rules.md). Poin arsitektural:

| Ancaman | Kontrol |
|---|---|
| Pencurian sesi | Access token di memori & singkat; refresh `httpOnly` + rotasi + deteksi reuse |
| CSRF | Refresh hanya lewat cookie `SameSite=Lax` pada `Path` terbatas; endpoint mutasi memakai header `Authorization` (bukan cookie) |
| Akses lintas grup / IDOR | Setiap query pesan/anggota diikat ke `groupId` + pemeriksaan keanggotaan; ID dari klien tak pernah dipercaya |
| Kebocoran real-time | Room per grup; akses dicabut seketika saat keanggotaan berubah; handler socket memeriksa keanggotaan setiap event |
| XSS | Pesan dirender sebagai teks; CSP ketat; tautan `noopener noreferrer` |
| Spam/DoS | Rate limit REST & socket (Redis), batas ukuran payload, batas koneksi per pengguna (mis. 5 socket) |
| Brute force | Rate limit login per IP+email, *delay* progresif |
| Unggahan berbahaya | Whitelist MIME, batas ukuran, verifikasi saat `complete`, nama acak, bucket privat |
| Penyalahgunaan Admin | Audit log tak dapat diubah dari aplikasi; Admin tak bisa menurunkan diri sendiri |
| Kebocoran data di log | Redaksi field sensitif; isi pesan tidak dicatat |

---

## 11. Skalabilitas, deployment & konfigurasi

### 11.1 Skalabilitas

| Aspek | Pendekatan |
|---|---|
| Horizontal scale | N instance backend di belakang proxy; Socket.IO Redis adapter untuk broadcast lintas instance |
| Basis data | Indeks untuk pola baca utama (lihat schema.md); *connection pooling* (PgBouncer bila perlu); replika baca bila beban baca tinggi |
| Riwayat pesan | Paginasi kursor `(group_id, id DESC)`; pertimbangkan partisi tabel `messages` bila > ratusan juta baris |
| Unread count | Dihitung dari `last_read_message_id` dengan batas atas (hitung maksimum 100 → tampil "99+") |
| Grup besar | Presence live dimatikan di atas ambang; typing dibatasi |
| Beban | Uji k6: 1.000 koneksi/instance, target p95 < 300 ms |

### 11.2 Lingkungan

| Lingkungan | Keterangan |
|---|---|
| **Lokal** | `docker compose -f infra/docker-compose.yml up -d` → Postgres, Redis, MinIO, Mailpit; FE & BE dijalankan `pnpm dev` |
| **CI** | Lint, typecheck, unit+integrasi (service container Postgres/Redis), build, pindai rahasia & dependensi, build image Docker |
| **Staging** | Otomatis dari `main`; data uji; E2E Playwright dijalankan di sini |
| **Produksi** | Deploy dari tag rilis; migrasi dijalankan sebagai langkah terpisah **sebelum** rollout (`prisma migrate deploy`); rollback = deploy image sebelumnya (migrasi backward compatible) |

### 11.3 Variabel lingkungan

**Backend (`apps/backend/.env.example`)**

| Variabel | Contoh / Keterangan |
|---|---|
| `NODE_ENV` | `development` \| `production` |
| `PORT` | `4000` |
| `DATABASE_URL` | `postgresql://user:pass@localhost:5432/kumpul` |
| `REDIS_URL` | `redis://localhost:6379` |
| `JWT_ACCESS_SECRET` | rahasia acak ≥ 32 byte |
| `JWT_ACCESS_TTL_SECONDS` | `900` |
| `REFRESH_TTL_DAYS` | `30` |
| `COOKIE_DOMAIN` | `.contoh.id` (kosongkan di lokal) |
| `CORS_ORIGINS` | `http://localhost:3000,https://app.contoh.id` |
| `S3_ENDPOINT` · `S3_REGION` · `S3_BUCKET` · `S3_ACCESS_KEY` · `S3_SECRET_KEY` | Konfigurasi object storage |
| `S3_PUBLIC_BASE_URL` | Basis URL avatar publik |
| `PRESENCE_MAX_GROUP_SIZE` | `500` |
| `ADMIN_EMAIL` · `ADMIN_PASSWORD` | **Hanya untuk seed** admin pertama |
| `LOG_LEVEL` · `SENTRY_DSN` | Observabilitas |

**Frontend (`apps/frontend/.env.example`)**

| Variabel | Contoh |
|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000/api/v1` |
| `NEXT_PUBLIC_WS_URL` | `http://localhost:4000` |

Nilai aturan bisnis (batas pesan, batas anggota, dll.) berada di `packages/shared/constants.ts` sebagai default dan dapat ditimpa BE lewat env bila perlu.

### 11.4 Observabilitas

- `GET /health` (liveness) dan `GET /health/ready` (DB + Redis).
- Metrik: koneksi socket aktif, latensi `message:send`, jumlah pesan/detik, error rate, pool DB.
- Log JSON dengan `requestId`; pelacak error (Sentry) tanpa data sensitif.

---

## 12. Catatan keputusan arsitektur (ADR)

| ID | Keputusan | Alasan | Konsekuensi |
|---|---|---|---|
| ADR-001 | **Modular monolith** (REST + WS dalam satu proses NestJS) | Tim kecil, kompleksitas operasional rendah, transaksi DB sederhana | Perlu disiplin batas modul; dapat dipecah kelak bila perlu |
| ADR-002 | **Socket.IO** dibanding WebSocket mentah | Reconnect, room, ack, adapter Redis sudah tersedia | Ketergantungan protokol Socket.IO; klien harus memakai library yang sama |
| ADR-003 | **PostgreSQL + Prisma** | Data relasional kuat, transaksi, constraint/indeks parsial | Constraint parsial & CHECK lewat SQL migrasi manual |
| ADR-004 | **ID pesan `BIGINT` identity** (string di JSON), entitas lain UUID | Urutan monoton, kursor sederhana, unread murah | Perlu serialisasi string; ID mudah ditebak → **wajib** cek keanggotaan di setiap akses |
| ADR-005 | **Kirim pesan lewat WebSocket** dengan ack + idempotensi | Latensi rendah, satu jalur realtime | Perlu jalur REST untuk aksi non-kirim & untuk sinkronisasi |
| ADR-006 | **Emit setelah commit** (bukan transactional outbox) di MVP | Sederhana; kegagalan emit jarang dan dapat dipulihkan lewat sinkronisasi | Bila butuh jaminan pengiriman kuat, tambah tabel outbox + worker |
| ADR-007 | **Refresh token cookie httpOnly + access token di memori** | Mengurangi risiko XSS mencuri sesi jangka panjang | FE & BE harus same-site; perlu konfigurasi domain cookie |
| ADR-008 | **Transport WebSocket saja** (tanpa polling) | Tidak butuh sticky session, lebih sederhana di balik proxy | Klien di jaringan yang memblokir WS tidak didukung (dapat diaktifkan polling + sticky nanti) |
| ADR-009 | **Monorepo dengan `packages/shared` hanya untuk tipe/skema** | Kontrak tunggal tanpa mengikat runtime FE/BE | Perubahan kontrak harus dikoordinasikan (lihat rules.md §7) |
| ADR-010 | **Presence & typing di Redis/ephemeral** | Data sementara, tidak perlu persistensi | Tidak ada riwayat presence; hanya `last_seen_at` |

---

## 13. Rujukan silang

- Perilaku & prioritas fitur → [PRD.md](./PRD.md)
- Skema data, indeks, dan kunci Redis → [schema.md](./schema.md)
- Aturan kode, testing, keamanan → [rules.md](./rules.md)
- Token & wireframe UI → [Design.md](./Design.md)
