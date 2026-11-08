# rules — Aturan Pengembangan Kumpul

> Dokumen ini adalah **kontrak kerja** untuk semua kontributor (manusia maupun AI coding assistant).
> Kata **WAJIB** = tidak boleh dilanggar tanpa persetujuan reviewer. **SEBAIKNYA** = default kuat, boleh menyimpang dengan alasan yang ditulis di PR.
> Dokumen terkait: [PRD.md](./PRD.md) · [Design.md](./Design.md) · [architecture.md](./architecture.md) · [schema.md](./schema.md)

---

## 1. Prinsip umum

1. **Sumber kebenaran:** perilaku produk → `PRD.md`; tampilan → `Design.md`; struktur & kontrak → `architecture.md`; data → `schema.md`. Bila kode dan dokumen bertentangan, **perbarui dokumen dalam PR yang sama**.
2. **Server adalah otoritas.** Semua validasi & otorisasi dilakukan di backend; validasi di frontend hanya untuk UX.
3. **Sederhana dulu.** Jangan menambah abstraksi, library, atau layanan baru tanpa kebutuhan nyata. Modular monolith adalah keputusan sadar (lihat ADR-001).
4. **Kecil dan sering.** PR kecil (idealnya < 400 baris diff), satu tujuan per PR.
5. **Tidak ada rahasia di repo.** Kunci, token, dan password hanya lewat environment variable.
6. **Bahasa:** kode, nama variabel, komit, dan komentar teknis dalam **Bahasa Inggris**; teks yang dilihat pengguna dalam **Bahasa Indonesia** (lewat kamus i18n); dokumen proyek dalam Bahasa Indonesia.

---

## 2. Struktur monorepo & batas modul

```
kumpul/
├── apps/
│   ├── frontend/          # Next.js (App Router) — UI
│   └── backend/           # NestJS — REST API + Socket.IO gateway
├── packages/
│   ├── shared/            # Konstanta, enum, skema zod, tipe kontrak API/WS
│   ├── eslint-config/     # Konfigurasi lint bersama
│   └── tsconfig/          # tsconfig dasar bersama
├── infra/                 # docker-compose, nginx/caddy, skrip deploy
├── docs/                  # PRD.md, Design.md, rules.md, architecture.md, schema.md
├── .github/workflows/     # CI
├── package.json  pnpm-workspace.yaml  turbo.json  .editorconfig  .nvmrc
```

**Aturan dependensi (WAJIB):**

| Dari → ke | Boleh? |
|---|:-:|
| `frontend` → `shared` | ✅ |
| `backend` → `shared` | ✅ |
| `frontend` → `backend` (import kode) | ❌ — FE dan BE hanya berkomunikasi lewat HTTP/WebSocket |
| `backend` → `frontend` | ❌ |
| `shared` → `frontend` / `backend` | ❌ |
| `shared` memakai library berat (Prisma, Nest, React) | ❌ — hanya `zod` dan tipe murni |

FE dan BE **memiliki `package.json`, dependensi, build, dan Dockerfile masing-masing** sehingga dapat di-deploy terpisah.

**Tooling:** pnpm workspaces + Turborepo · Node.js LTS (dikunci di `.nvmrc` dan `engines`) · TypeScript `strict`.

---

## 3. Git & alur kerja

### 3.1 Branch

- `main` — selalu dapat di-deploy, **dilindungi** (tidak ada push langsung, wajib PR + CI hijau + 1 review).
- Cabang kerja: `feat/<ringkas>`, `fix/<ringkas>`, `chore/<ringkas>`, `docs/<ringkas>`, `refactor/<ringkas>`. Contoh: `feat/vip-request-approval`.
- Rebase/merge `main` sebelum minta review. Merge memakai **squash**.

### 3.2 Pesan komit — Conventional Commits (WAJIB)

```
<type>(<scope>): <deskripsi imperatif, huruf kecil, tanpa titik>

feat(backend): add vip request approval transaction
fix(frontend): keep scroll position when loading older messages
docs: update architecture ws events
```

Type: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `perf`, `ci`, `build`. Scope: `frontend`, `backend`, `shared`, `infra`, `docs`. Hook `commitlint` + `husky` menegakkan format; `lint-staged` menjalankan lint/format pada berkas yang berubah.

### 3.3 Pull Request

Template PR wajib berisi: **Apa & mengapa**, cara menguji, screenshot (untuk UI), dampak skema/migrasi, dan centang checklist di bagian 12.

---

## 4. Aturan TypeScript & kode umum

- `strict: true`, `noUncheckedIndexedAccess: true`. **Dilarang `any`** (gunakan `unknown` + penyempitan tipe). `// @ts-ignore` dilarang; `@ts-expect-error` hanya dengan komentar alasan.
- Penamaan: `camelCase` variabel/fungsi · `PascalCase` tipe/kelas/komponen · `UPPER_SNAKE_CASE` konstanta · `kebab-case` nama berkas & folder (`vip-requests.service.ts`, `group-list-item.tsx`).
- Enum & konstanta lintas FE/BE didefinisikan **sekali** di `packages/shared`.
- Fungsi pendek dan satu tugas. Hindari *magic number*; angka aturan bisnis diambil dari konfigurasi (PRD bagian 9).
- Tangani error secara eksplisit; **dilarang** menelan error (`catch {}` kosong). Lempar error bertipe (domain error), jangan string.
- Komentar menjelaskan **mengapa**, bukan **apa**. TODO wajib menyertakan isu/tiket: `// TODO(#123): ...`.
- Waktu: simpan dan kirim **UTC ISO-8601**; konversi ke zona waktu pengguna hanya di UI.
- ID: UUID untuk sebagian besar entitas; `BigInt` (pesan) **selalu diserialisasi sebagai string** di JSON.
- Formatter: Prettier (`printWidth: 100`, semicolon, single quote, trailing comma `all`). Lint: ESLint (config bersama). Tidak ada warning yang dibiarkan di `main`.

---

## 5. Aturan Backend (`apps/backend`)

### 5.1 Struktur modul NestJS

```
src/
├── main.ts  app.module.ts
├── config/                 # validasi env (zod), ConfigService
├── common/                 # guards, interceptors, filters, decorators, pipes, utils
├── infra/                  # prisma/, redis/, storage/ (S3), mailer/
└── modules/
    ├── auth/  users/  groups/  members/  messages/
    ├── vip-requests/  notifications/  uploads/  admin/
    ├── realtime/           # Socket.IO gateway, presence, typing
    └── audit/
```

Setiap modul: `*.module.ts`, `*.controller.ts` (HTTP), `*.gateway.ts` (bila ada), `*.service.ts` (logika bisnis), `*.repository.ts` (opsional, bila query kompleks), `dto/`, `policies/`, `*.spec.ts`.

### 5.2 Layering (WAJIB)

`Controller / Gateway` → `Service` → `Prisma (repository)`.

- Controller/Gateway: **hanya** parsing, validasi DTO, memanggil service, memetakan respons. Tanpa logika bisnis.
- Service: logika bisnis, transaksi, otorisasi tingkat domain, memancarkan event realtime lewat `RealtimePublisher`.
- Modul tidak boleh mengakses tabel modul lain secara langsung; panggil service modul tersebut (atau gunakan event domain internal).
- Query Prisma **tidak** ditulis di controller.

### 5.3 Validasi & DTO

- Semua input (body, query, params, payload socket) divalidasi memakai **skema zod** (dibagi dari `packages/shared` bila juga dipakai FE) melalui `ZodValidationPipe`.
- Respons dipetakan ke DTO; **jangan** mengembalikan entitas Prisma mentah (mencegah kebocoran `passwordHash`, dll.).

### 5.4 Otorisasi (WAJIB)

- Autentikasi: `JwtAuthGuard` global; endpoint publik ditandai `@Public()`.
- Peran global: `@Roles(Role.ADMIN)` + `RolesGuard`.
- Peran per grup: policy di `modules/*/policies` (mis. `canModerate(user, membership)`), dipanggil di service. **Jangan** mengandalkan data peran dari klien.
- Setiap handler event socket **wajib** memeriksa: pengguna terautentikasi, `status = ACTIVE`, keanggotaan `ACTIVE` pada grup, grup tidak `ARCHIVED` (untuk aksi tulis).
- Perlakukan **ID dari klien sebagai tidak tepercaya**: selalu verifikasi bahwa resource memang milik/terhubung dengan grup & pengguna terkait (cegah IDOR).
- Tes otorisasi (kasus ditolak) adalah **bagian dari Definition of Done** setiap endpoint/event.

### 5.5 Database

- Perubahan skema **hanya** lewat migrasi Prisma (`prisma migrate dev` → berkas migrasi di-commit). Dilarang mengubah DB manual atau `db push` di luar lokal.
- Migrasi harus **backward compatible** dengan versi kode sebelumnya (pola expand → migrate → contract) agar deploy tanpa downtime.
- Operasi multi-langkah memakai `prisma.$transaction`. Operasi yang rawan balapan (batas anggota, persetujuan VIP, kode undangan) memakai **row lock** (`SELECT … FOR UPDATE`) atau constraint unik + penanganan error.
- Query daftar **wajib** paginasi (kursor) dan memiliki indeks pendukung (lihat `schema.md`). Dilarang `findMany` tanpa `take` pada tabel yang tumbuh.
- Hindari N+1; gunakan `include/select` yang sengaja atau query raw yang ditinjau.
- Soft delete: filter `deletedAt IS NULL` di semua query baca (gunakan Prisma extension/helper, bukan diulang manual).

### 5.6 REST API

- Prefiks `/api/v1`. Sumber daya jamak, kebab-case: `/groups/:id/members`, `/vip-requests`.
- Metode: `GET` baca · `POST` buat/aksi · `PATCH` ubah sebagian · `DELETE` hapus. Aksi non-CRUD berupa sub-sumber daya kata kerja: `POST /vip-requests/:id/cancel`.
- Kode status: 200/201/204 sukses · 400 validasi · 401 belum autentikasi · 403 terlarang · 404 tidak ada (atau disamarkan) · 409 konflik · 422 aturan bisnis · 429 rate limit · 5xx galat server.
- **Format error seragam:**
  ```json
  { "error": { "code": "GROUP_FULL", "message": "Grup sudah penuh.", "details": null, "requestId": "…" } }
  ```
  `code` bersifat stabil dan berupa `UPPER_SNAKE_CASE` (didefinisikan di `packages/shared/errors.ts`); `message` boleh berubah.
- Paginasi kursor: `?limit=50&before=<id>` / `?after=<id>`; respons `{ "items": [...], "nextCursor": "…" | null }`.
- Perubahan yang merusak kompatibilitas → versi baru (`/api/v2`), bukan mengubah yang lama.
- Dokumentasi OpenAPI dibangkitkan otomatis (Swagger) di lingkungan non-produksi.

### 5.7 WebSocket (Socket.IO)

- Namespace `/chat`. Nama event `domain:aksi` huruf kecil (`message:send`, `typing:start`). Daftar resmi ada di `architecture.md` dan tipenya di `packages/shared`.
- Setiap event dari klien yang mengubah state **wajib mengembalikan ack**: `{ ok: true, data }` atau `{ ok: false, error: { code, message } }`.
- Autentikasi pada *handshake* (`auth.token`). Token kedaluwarsa → koneksi ditolak dengan `AUTH_TOKEN_EXPIRED`; klien refresh lalu sambung ulang.
- Kirim pesan **idempoten** lewat `clientMessageId` (UUID dari klien).
- Rate limit per pengguna di gateway (Redis token bucket). Payload dibatasi ukuran (`maxHttpBufferSize`).
- Broadcast hanya ke *room* yang tepat (`group:{id}`, `user:{id}`). **Dilarang** broadcast global untuk data grup.
- Saat keanggotaan berubah (join/leave/kick/ban/arsip), server **langsung** menyesuaikan room dan memutus akses (`socketsLeave`).

### 5.8 Logging, konfigurasi, dan galat

- Logger terstruktur (pino/nestjs-pino) JSON; setiap request punya `requestId` (dikembalikan di header `x-request-id` dan di body error).
- **Dilarang** mencatat password, token, isi pesan, atau data pribadi di log.
- Konfigurasi hanya lewat env yang divalidasi zod saat startup (gagal cepat bila kurang). Sediakan `.env.example` terbaru; `.env` **tidak** di-commit.
- Filter exception global memetakan error domain → format error seragam; error tak terduga → 500 tanpa membocorkan detail internal.
- Tindakan admin & moderasi **wajib** menulis `audit_logs` dalam transaksi yang sama dengan aksinya.

---

## 6. Aturan Frontend (`apps/frontend`)

### 6.1 Struktur

```
src/
├── app/                    # Rute App Router: (auth)/, (app)/, (admin)/
├── components/ui/          # Primitif (shadcn/ui yang di-restyle)
├── features/               # Per domain: auth/, groups/, chat/, vip/, admin/, notifications/
│   └── chat/  { components/, hooks/, api.ts, store.ts, types.ts }
├── lib/                    # api-client, socket-client, i18n, utils
├── styles/                 # tokens.css, globals.css
└── messages/id.json        # Kamus teks (i18n)
```

### 6.2 State & data

- **Data server** (daftar grup, riwayat, pengajuan, dll.) → **TanStack Query**. **State klien/UI** (draft, panel terbuka, status koneksi, typing) → **Zustand**. Jangan menyalin data server ke Zustand tanpa alasan.
- Klien Socket.IO adalah **singleton** (`lib/socket-client.ts`), dikelola oleh satu provider. Event masuk memperbarui *cache* TanStack Query (`setQueryData`) — komponen tidak mengelola listener sendiri-sendiri.
- Access token disimpan **di memori** (bukan `localStorage`). Refresh token via cookie `httpOnly` (dikelola server). Interceptor melakukan refresh otomatis satu kali lalu mengulang request.
- Optimistic UI untuk kirim pesan wajib mengikuti siklus status di `Design.md` §4.3, termasuk **Kirim ulang** dengan `clientMessageId` yang sama.
- Setelah reconnect: ambil pesan terlewat via `GET /groups/:id/messages?after=<lastId>` dan gabungkan tanpa duplikat (kunci: `id` / `clientMessageId`).

### 6.3 Komponen & gaya

- Komponen fungsional + hooks. Server Component secara default; `"use client"` hanya bila butuh state/efek/event browser.
- Style **hanya** memakai token (Tailwind mengarah ke CSS variables). **Dilarang** warna hex/ukuran mentah di komponen fitur.
- Setiap komponen fitur menangani state **loading, empty, error**. Daftar pesan memakai **virtualisasi**.
- Semua teks yang terlihat pengguna diambil dari `messages/id.json` (bukan string literal di JSX). Kunci berbentuk `domain.konteks.elemen` (`vip.request.submit`).
- Form: `react-hook-form` + skema zod bersama. Tampilkan error per kolom.
- **Aksesibilitas WAJIB** (Design.md §8): label untuk input dan ikon-tombol, fokus terlihat, navigasi keyboard, `aria-live` untuk pesan baru.
- Jangan render HTML dari pengguna dengan `dangerouslySetInnerHTML`. Konten pesan dirender sebagai teks; tautan otomatis memakai `rel="noopener noreferrer nofollow"`.
- Rute admin dilindungi di `middleware` **dan** tetap diverifikasi ulang oleh backend (middleware hanya UX, bukan keamanan).

### 6.4 Performa

- Pantau bundle (budget awal halaman chat ≤ 250 kB gzip JS). *Code-split* panel admin dan editor berat.
- Gambar: `next/image`, ukuran eksplisit, *lazy loading*.
- Hindari re-render berlebih pada daftar pesan (`memo`, selector Zustand yang sempit).

---

## 7. Aturan kontrak (`packages/shared`)

- Berisi: enum (`Role`, `GroupType`, …), konstanta batas (`MESSAGE_MAX_LENGTH`), skema zod request/response, tipe payload event socket, dan kode error.
- Perubahan kontrak diperlakukan seperti perubahan API publik: perbarui `architecture.md` dan sebutkan di PR.
- Dilarang menaruh logika bisnis atau akses I/O di sini.

---

## 8. Keamanan (checklist WAJIB)

| # | Aturan |
|---|---|
| 1 | Password di-hash **Argon2id**; tidak pernah dicatat atau dikembalikan. |
| 2 | Access token JWT umur 15 menit; refresh token acak 256-bit, **disimpan ter-hash** di DB, berputar setiap dipakai, deteksi *reuse* → cabut seluruh *family*. |
| 3 | Cookie refresh: `HttpOnly; Secure; SameSite=Lax; Path=/api/v1/auth`. |
| 4 | CORS memakai **allowlist** origin dari env; `credentials: true` hanya untuk origin tersebut. Origin Socket.IO diperiksa dengan daftar yang sama. |
| 5 | `helmet` aktif; CSP ketat di FE; HSTS di produksi. |
| 6 | Rate limiting: login (5/menit per IP+email), pendaftaran, pengajuan VIP, kirim pesan, presign upload. |
| 7 | Validasi semua input (zod). Panjang & tipe dibatasi; payload socket dibatasi ukuran. |
| 8 | Otorisasi di server untuk **setiap** endpoint dan event; cegah IDOR (lihat 5.4). |
| 9 | Unggahan: presigned URL dengan batas ukuran & `Content-Type` yang di-whitelist; verifikasi ulang tipe/ukuran saat *finalize*; bucket privat; nama berkas acak (UUID), bukan dari pengguna. |
| 10 | Kode undangan VIP: acak kriptografis (≥ 10 karakter base62), dapat di-regenerate, dibatasi rate saat dicoba. |
| 11 | Pencegahan XSS: render teks murni; tidak ada `dangerouslySetInnerHTML`; sanitasi bila suatu saat mendukung markdown. |
| 12 | Dependensi: `pnpm audit` di CI; Dependabot/Renovate aktif; lockfile di-commit. |
| 13 | Rahasia hanya di env/secret manager; pemindai rahasia (mis. gitleaks) di CI. |
| 14 | Akun `SUSPENDED` → sesi dicabut & socket diputus segera. |
| 15 | Log tidak memuat data sensitif; audit log tidak dapat diubah dari aplikasi. |

---

## 9. Testing

| Lapisan | Alat | Cakupan wajib |
|---|---|---|
| Unit (BE) | Jest | Service & policy: aturan bisnis, batas (grup penuh, 1 pengajuan pending, jeda 24 jam, jendela edit 15 menit) |
| Integrasi (BE) | Jest + Supertest + Postgres/Redis uji (Testcontainers atau Compose) | Endpoint REST end-to-end ke DB nyata; transaksi persetujuan VIP; otorisasi (kasus ditolak) |
| Realtime (BE) | Jest + `socket.io-client` | Kirim/terima pesan, ack, idempotensi, penolakan nonanggota, pemutusan akses saat kick |
| Unit/komponen (FE) | Vitest + Testing Library | Komponen chat (bubble, composer, status), hooks, store |
| E2E | Playwright | Daftar → gabung grup → chat dua pengguna realtime; ajukan VIP → Admin setujui → jadi Owner; kick |
| Beban | k6 / Artillery | 1.000 koneksi socket per instance, p95 < 300 ms |

- Target cakupan: **service BE ≥ 80%**; alur kritis (auth, kirim pesan, VIP approval, otorisasi) **100% jalur utama + jalur ditolak**.
- Nama tes deskriptif: `it("rejects a second pending vip request from the same user")`.
- Tes harus deterministik: tanpa `sleep` sembarangan, waktu di-*mock* bila perlu, DB uji dibersihkan per suite.
- Bug yang diperbaiki **wajib** disertai tes regresi.

---

## 10. Observabilitas & operasi

- Endpoint `GET /health` (liveness) dan `GET /health/ready` (cek DB & Redis).
- Metrik minimum: koneksi socket aktif, latensi kirim pesan, error rate, kedalaman antrean/job.
- Error tak tertangani dikirim ke pelacak error (mis. Sentry) dengan `requestId`, tanpa data sensitif.
- Job terjadwal: bersihkan lampiran yatim (> 24 jam), bersihkan refresh token kedaluwarsa, bersihkan notifikasi lama (> 90 hari).

---

## 11. Dokumentasi & keputusan arsitektur

- Keputusan penting dicatat sebagai **ADR** singkat di `docs/adr/NNN-judul.md` (konteks, keputusan, konsekuensi). ADR awal ada di `architecture.md` §12.
- README di `apps/frontend` dan `apps/backend` menjelaskan cara menjalankan, skrip, dan variabel lingkungan.
- Perubahan perilaku produk → perbarui `PRD.md`; perubahan tabel/index → perbarui `schema.md`.

---

## 12. Definition of Done & checklist PR

Sebuah perubahan **selesai** bila:

- [ ] Memenuhi acceptance criteria di PRD (sebutkan ID, mis. `VIP-04`)
- [ ] Lint, typecheck, dan seluruh tes lulus di CI
- [ ] Tes baru untuk logika baru, **termasuk kasus otorisasi ditolak**
- [ ] Input divalidasi (zod); error memakai kode standar
- [ ] Migrasi DB (bila ada) di-commit, backward compatible, dan `schema.md` diperbarui
- [ ] Tidak ada rahasia/PII di kode & log; `.env.example` diperbarui
- [ ] UI: memakai token, dua tema, state loading/empty/error, responsif, aksesibel, teks di i18n
- [ ] Dokumen terkait diperbarui (PRD/architecture/schema/Design)
- [ ] Sudah direview minimal 1 orang; tidak ada komentar terbuka

---

## 13. Perintah standar (root monorepo)

| Perintah | Fungsi |
|---|---|
| `pnpm install` | Pasang dependensi seluruh workspace |
| `pnpm dev` | Jalankan FE + BE mode dev (Turborepo) |
| `pnpm --filter @kumpul/backend dev` / `pnpm --filter @kumpul/frontend dev` | Jalankan salah satu |
| `pnpm build` | Build semua (dengan cache Turborepo) |
| `pnpm lint` · `pnpm typecheck` · `pnpm test` | Kualitas kode |
| `pnpm test:e2e` | Playwright |
| `pnpm db:migrate` · `pnpm db:seed` · `pnpm db:studio` | Migrasi, seed (Admin + grup contoh), Prisma Studio |
| `docker compose -f infra/docker-compose.yml up -d` | Postgres, Redis, MinIO, Mailpit untuk lokal |

Nama paket: `@kumpul/frontend`, `@kumpul/backend`, `@kumpul/shared`.

---

## 14. Aturan khusus untuk AI coding assistant

Bila asisten AI (Claude, Copilot, Cursor, dsb.) menulis atau mengubah kode di repo ini:

1. **Baca dulu** dokumen relevan (`PRD.md`, `architecture.md`, `schema.md`, `Design.md`) sebelum menulis kode. Jangan mengarang endpoint, event, tabel, atau kode error — gunakan yang terdokumentasi; jika perlu yang baru, **ajukan perubahan dokumen** terlebih dulu.
2. Ikuti aturan dependensi (bagian 2) dan layering (5.2). Jangan membuat impor silang FE ↔ BE.
3. Jangan menambah dependensi baru tanpa menyebut alasan dan alternatifnya.
4. Selalu sertakan **validasi zod, pengecekan otorisasi, dan tes** (termasuk kasus ditolak) dalam perubahan fitur.
5. Jangan menulis atau menampilkan rahasia; gunakan placeholder dan `.env.example`.
6. Jangan menghapus atau melemahkan tes/lint/typecheck agar build "hijau".
7. Perubahan besar dipecah menjadi langkah kecil yang dapat direview; jelaskan asumsi bila spesifikasi ambigu, jangan menebak diam-diam.
8. Untuk UI: pakai token dari `Design.md`, sediakan state loading/empty/error, dan teks dari kamus i18n.
