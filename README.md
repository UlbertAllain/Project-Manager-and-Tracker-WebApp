# Nexty Workspace

Nexty Workspace adalah internal project management system untuk mengatur proyek, pekerjaan tim, kolaborasi, laporan, dan evaluasi operasional perusahaan.

Sistem ini dirancang untuk menggantikan koordinasi kerja yang tersebar di chat dan spreadsheet dengan satu workspace internal yang memiliki role, project visibility, task ownership, activity context, dan laporan yang lebih konsisten.

## Product Scope

Pengguna internal:
- Admin / Owner
- Project Manager
- Team Member

Client tidak memiliki akun dan tidak masuk ke workspace internal.

Alur komunikasi tetap:

```text
Client ↔ Project Manager ↔ Tim internal
```

Detail scope: [docs/PRODUCT_SCOPE_V3.md](docs/PRODUCT_SCOPE_V3.md).

## Fitur Utama

- Dashboard sesuai role.
- My Work untuk tugas harian user.
- Project portfolio.
- Project board.
- Project detail.
- Task assignment dan status workflow.
- Comment/laporan dalam konteks project.
- Attachment link.
- Activity history.
- Team directory dan role management.
- Finance khusus role berwenang.
- Reports dan portfolio insight.

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS
- Firebase Authentication
- Cloud Firestore melalui Firebase Admin SDK
- Zod
- Lucide React

## Security Model

Firebase Client SDK dipakai hanya untuk login.

Operational data memakai server-authoritative flow:

```text
UI / Form
↓
Server Action / Route Handler
↓
Verified HttpOnly Session
↓
Role / Project Authorization
↓
Runtime Validation
↓
Repository
↓
Firebase Admin SDK
↓
Firestore
```

Firestore Security Rules menolak browser read/write untuk operational data.

Session dibuat dari Firebase ID token yang diverifikasi dan disimpan sebagai HttpOnly cookie. Role dari browser bukan sumber kebenaran.

Lihat:
- [ARCHITECTURE.md](ARCHITECTURE.md)
- [ENGINEERING_STANDARD.md](ENGINEERING_STANDARD.md)
- [AGENTS.md](AGENTS.md)

## Project Structure

```text
src/app/                routes, pages, route handlers
src/features/           project/user/auth feature logic and UI
src/lib/auth/           session + authorization guards
src/lib/firebase/       Firebase client/admin bootstrap
src/lib/repositories/   Firestore persistence/query layer
src/components/         reusable application UI
scripts/                controlled seed/migration scripts
docs/                   product, audit, migration, release docs
```

Project repository layer masih memuat compatibility logic untuk data legacy. Refactor dilakukan incremental agar migration compatibility tidak merusak authorization atau data lama.

## Local Setup

Gunakan Node.js 22 untuk environment yang konsisten dengan CI.

```bash
cp .env.example .env.local
npm ci
npm run seed:admin
npm run migrate:v3
npm run dev
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
npm ci
npm run seed:admin
npm run migrate:v3
npm run dev
```

Jalankan seed/migration hanya pada environment yang memang membutuhkan bootstrap atau migrasi data.

## Environment

Firebase Web SDK:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

Firebase Admin:

```env
FIREBASE_SERVICE_ACCOUNT=
```

Admin bootstrap lokal:

```env
SEED_ADMIN_EMAIL=
SEED_ADMIN_PASSWORD=
SEED_ADMIN_NAME=Administrator
```

Jangan commit service account, private key, atau `.env.local`.

## Quality Gate

```bash
npm run check
```

Saat ini `npm run check` menjalankan:

- ESLint
- TypeScript
- Next.js production build

GitHub Actions menambahkan:

- deterministic `npm ci`;
- dependency audit report;
- blocking gate untuk vulnerability level high/critical.

## Migration and Audit Documentation

Dokumentasi penting:

- [docs/AUDIT_REPORT.md](docs/AUDIT_REPORT.md)
- [docs/PRODUCT_SCOPE_V3.md](docs/PRODUCT_SCOPE_V3.md)
- [docs/MIGRATION_GUIDE.md](docs/MIGRATION_GUIDE.md)
- [docs/MIGRATION_V3.md](docs/MIGRATION_V3.md)
- [docs/UI_AUDIT_V3_2.md](docs/UI_AUDIT_V3_2.md)

## Engineering Notes

Perubahan authentication, authorization, finance access, project visibility, task ownership, export, atau Firestore repository harus mempertahankan server-side authorization.

Jangan menambahkan kembali:
- browser-trusted role/UID;
- runtime reset database endpoint;
- runtime seed endpoint dengan default credential;
- direct client Firestore access untuk operational data;
- duplicate realtime/cache architecture tanpa kebutuhan terukur.
