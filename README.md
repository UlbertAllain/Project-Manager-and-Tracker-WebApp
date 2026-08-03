# Nexty Workspace v3.2

Internal Project Management System untuk mengatur pekerjaan, kolaborasi, pelaporan, dan evaluasi proyek perusahaan.

## Fokus produk

- Admin/Owner mengelola user, portofolio proyek, laporan, dan keuangan.
- Project Manager mengatur proyek, tim, task, deadline, review, dan revisi.
- Team Member mengelola pekerjaan yang ditugaskan, komentar, attachment, dan pelaporan progres.
- Client tidak memiliki akun dan tidak masuk ke workspace internal.

## Stack

- Next.js 16
- TypeScript
- Tailwind CSS 3
- Firebase Authentication
- Cloud Firestore melalui Firebase Admin SDK
- Lucide React
- Zod

## Setup

```bash
cp .env.example .env.local
npm install
npm run seed:admin
npm run migrate:v3
npm run dev
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
npm install
npm run seed:admin
npm run migrate:v3
npm run dev
```

## Pemeriksaan

```bash
npm run check
```

## Dokumentasi

- `docs/PRODUCT_SCOPE_V3.md`
- `docs/MIGRATION_V3.md`
- `docs/UI_AUDIT_V3_2.md`
- `docs/CHANGELOG_V3_2.md`
