# ARCHITECTURE.md

## Overview

Nexty Workspace menggunakan modular monolith berbasis Next.js App Router dengan server-authoritative data access.

Firebase Client SDK dipakai hanya untuk login. Seluruh data operasional Firestore dibaca dan ditulis melalui Firebase Admin SDK di server.

## Authentication Flow

```text
Login Form
↓
Firebase Auth Client
↓
Firebase ID Token
↓
POST /api/session
↓
verifyIdToken()
↓
HttpOnly Session Cookie
↓
verifySessionCookie()
```

Client auth persistence menggunakan in-memory session. Setelah server session dibuat, browser sign-out dari Firebase Client tidak menghapus server session cookie.

## Operational Data Flow

```text
Page / Form
↓
Server Action / Route Handler
↓
getCurrentUser()
↓
Authorization Guard
↓
Zod Validation
↓
Feature / Domain Logic
↓
Repository
↓
Firebase Admin SDK
↓
Firestore
```

Firestore Security Rules menolak seluruh browser read/write untuk operational collections.

## Structure

```text
src/
├── app/
│   ├── (app)/
│   ├── api/
│   └── login/
├── features/
│   ├── auth/
│   ├── finance/
│   ├── projects/
│   └── users/
├── lib/
│   ├── auth/
│   ├── firebase/
│   └── repositories/
└── components/

docs/
scripts/
```

### src/app/
Framework concern dan page composition. Hindari business rule besar di page.

### src/features/
Feature-specific components, server actions, schemas, types, dan presentation logic.

### src/lib/repositories/
Persistence boundary. Repository boleh mengetahui Firestore/Admin SDK, tetapi tidak boleh menjadi tempat keputusan authorization.

### src/lib/auth/
Session verification dan reusable authorization guard.

### src/lib/firebase/
Firebase bootstrap saja.

## Authorization

Authentication tidak sama dengan authorization.

Setiap mutation/read sensitif harus mempertimbangkan:
- current verified session;
- user role;
- project lead/member assignment;
- resource ownership bila relevan;
- finance/admin-only policy.

Client-supplied role atau UID tidak authoritative.

## Legacy Compatibility

Repository project masih membaca beberapa legacy collection/path untuk migrasi kompatibel. Compatibility code boleh dipertahankan selama:
- authorization tetap server-side;
- data mapping deterministik;
- tidak membuat double-write tanpa kebutuhan;
- migration docs menjelaskan jalur penghapusan compatibility.

Jangan melakukan big-bang migration hanya untuk merapikan folder.

## Read Performance

Hindari:
- full collection scan tanpa kebutuhan;
- N+1 query lintas seluruh portfolio;
- write side-effect saat read;
- sorting besar di memory bila Firestore query/index dapat menyelesaikan dengan jelas.

Optimization dilakukan berdasarkan real access pattern, bukan abstraksi kosmetik.

## Architecture Status

Architecture: Modular Monolith  
Data Access: Server-authoritative  
Persistence: Firebase Admin repositories  
Client Firebase: Authentication only  
Firestore Rules: Deny-all operational access  
Migration Strategy: Incremental
