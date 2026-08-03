# Hotfix v3.0.1 — Migrasi user tanpa akun Firebase Auth

## Masalah

Migrasi v3 sebelumnya menghentikan seluruh proses ketika menemukan dokumen
`users/{uid}` di Firestore, tetapi UID tersebut tidak ada di Firebase
Authentication.

## Perbaikan

Migrasi sekarang:

1. Mencari akun Firebase Authentication berdasarkan UID dokumen.
2. Jika UID tidak ditemukan, mencoba mencocokkan berdasarkan email.
3. Jika email cocok, data dipindahkan secara logis ke UID Firebase Auth yang benar
   dan referensi project/task ikut dinormalisasi.
4. Jika akun tetap tidak ditemukan, dokumen ditandai `authStatus=MISSING`,
   dinonaktifkan, dan migrasi data lain tetap dilanjutkan.
5. Dokumen alias dan akun tanpa Auth tidak ditampilkan sebagai anggota aktif di
   halaman Team maupun pilihan assignment.

## Cara memasang

Timpa dua file berikut:

- `scripts/migrate-v3.mjs`
- `lib/repositories/users.ts`

Lalu jalankan:

```bash
npm run migrate:v3
```

Tidak ada dependency baru dan tidak perlu menjalankan `npm install`.

Setelah migrasi, seluruh pengguna aktif harus logout lalu login kembali.
