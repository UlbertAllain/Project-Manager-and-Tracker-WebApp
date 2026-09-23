# ENGINEERING_STANDARD.md

## Principles

Gunakan Clean Code, Separation of Concerns, SRP, DRY, KISS, YAGNI, strict TypeScript, runtime validation, dan security-first design.

## TypeScript

- Hindari `any`; gunakan explicit domain type atau `unknown` + narrowing.
- External/request/legacy data harus dinormalisasi sebelum masuk business logic.
- Jangan memakai type assertion untuk menutupi invalid data.

## Server Actions and Routes

Server action/route handler bertanggung jawab atas:
1. authentication;
2. authorization;
3. validation;
4. orchestration;
5. safe error surface.

Jangan memasukkan query persistence kompleks langsung ke UI/page jika sudah menjadi reusable data access.

## Repository

Repository bertanggung jawab atas:
- Firestore query;
- document mapping;
- persistence;
- legacy-path compatibility bila masih diperlukan.

Repository tidak boleh memutuskan permission berdasarkan input browser.

## Authentication and Authorization

- Firebase ID token harus diverifikasi server-side.
- Session cookie harus HttpOnly.
- Role berasal dari verified session/custom claim.
- Resource authorization tetap dicek terhadap data server.
- Firestore Rules deny-all adalah defense-in-depth untuk browser access.

## Validation

Gunakan Zod untuk input mutation dan request body.

Untuk legacy Firestore document, mapping function harus:
- memberi fallback yang eksplisit;
- menormalisasi enum;
- menghindari silent privilege escalation.

## Errors

User-facing error tidak boleh membocorkan:
- stack trace;
- service-account detail;
- raw Admin SDK credential/error;
- internal security implementation.

## Security

Review perubahan terhadap:
- AuthN;
- AuthZ;
- session fixation/replay;
- same-origin request;
- Firestore exposure;
- secret handling;
- dependency vulnerability;
- destructive operation;
- export/download access.

## Testing

Prioritas test:
1. permission/guard;
2. project visibility;
3. task mutation rules;
4. finance authorization;
5. session flow;
6. data mapping/migration regression.

Belum ada target 100% coverage. Critical business/security behavior lebih penting.

## Quality Gate

```bash
npm run lint
npm run typecheck
npm run build
```

Gunakan `npm run check` untuk gate standar repository.

CI juga harus memblokir dependency vulnerability level high/critical.
