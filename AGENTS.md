# AGENTS.md

## Purpose

Aturan kerja untuk developer dan coding agent yang mengubah Nexty Workspace.

Baca sebelum coding:
- `ARCHITECTURE.md`
- `ENGINEERING_STANDARD.md`
- dokumentasi terkait di `docs/`

## Stack

- Next.js 16 + TypeScript
- Firebase Authentication
- Cloud Firestore melalui Firebase Admin SDK
- Zod
- Tailwind CSS

## Architecture Rule

Operational Firestore data is server-only.

Target flow:

```text
Page / Client UI
↓
Server Action / Route Handler
↓
Verified Session
↓
Role / Project Authorization
↓
Validation
↓
Domain / Feature Logic
↓
Repository
↓
Firebase Admin SDK
↓
Firestore
```

Firebase Client SDK hanya digunakan untuk Authentication. Jangan menambahkan client Firestore access.

## Folder Responsibilities

- `app/`: routing, page composition, route handlers.
- `features/`: feature UI, actions, schemas, domain types.
- `lib/repositories/`: Firestore persistence/query implementation.
- `lib/auth/`: session dan authorization guards.
- `lib/firebase/`: Firebase client/admin bootstrap.
- `components/`: reusable application UI/layout.
- `docs/`: product, migration, audit, release documentation.
- `scripts/`: controlled local migration/bootstrap scripts.

## Security Rules

- Jangan percaya UID, role, project membership, atau permission dari browser.
- Session harus berasal dari Firebase ID token yang diverifikasi.
- Data operation wajib memakai server-side authorization.
- Firestore Rules tetap deny-all untuk operational data.
- Runtime seed/reset/destructive admin endpoint tidak boleh ditambahkan.
- Service account dan env secret tidak boleh di-commit.

## Data Rules

- Project visibility ditentukan server-side.
- Member hanya boleh melihat/mengubah data yang memang diizinkan assignment/role.
- Finance hanya boleh tersedia untuk role berwenang.
- Mutation project/task/comment/attachment wajib melewati guard dan runtime validation.
- Migration compatibility tidak boleh menjadi alasan melemahkan authorization.

## Scope

Nexty Workspace adalah internal project management system, bukan client portal.

Jangan menambahkan fitur besar hanya untuk terlihat lengkap. Ikuti `docs/PRODUCT_SCOPE_V3.md`.

## Verification

Sebelum selesai:

```bash
npm run lint
npm run typecheck
npm run build
```

Atau:

```bash
npm run check
```

Dependency high/critical tidak boleh lolos CI.
