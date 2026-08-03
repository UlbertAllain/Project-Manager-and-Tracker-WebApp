# Migrasi v2/v2.1 ke v3

## Sebelum mulai

1. Backup Firestore.
2. Buat branch Git terpisah.
3. Simpan `.env.local` lama di luar folder yang akan ditimpa.
4. Pastikan admin lama masih dapat login.

## Pasang source

Tutup development server, timpa file project dengan patch/full source v3, lalu hapus cache:

### PowerShell

```powershell
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
```

### CMD

```bat
rmdir /s /q .next
```

Dependency tidak berubah dari v2.1. Bila `node_modules` masih tersedia, tidak wajib menjalankan `npm install` ulang.

## Migrasi data

Jalankan:

```bash
npm run migrate:v3
```

Script melakukan:

- `PROJECT_LEAD` menjadi `PROJECT_MANAGER`.
- `STAFF` menjadi `MEMBER`.
- Menulis custom claim role ke Firebase Authentication.
- Menambahkan profil user yang belum lengkap.
- Mencocokkan project lead lama berdasarkan nama/email.
- Mencocokkan assignee task lama berdasarkan nama/email.
- Menambahkan status dan priority task default.
- Mempertahankan collection legacy agar data lama tetap terbaca.

## Setelah migrasi

Semua pengguna harus logout dan login kembali. Session cookie lama belum memiliki claim role terbaru.

Masuk sebagai admin, lalu buka `/team` untuk memeriksa:

- Role.
- Jabatan.
- Departemen.
- Status aktif.

Buka setiap project penting dan periksa:

- Project manager.
- Anggota project.
- Assignee task.
- Deadline.
- Status task.

## Data yang mungkin perlu diperbaiki manual

Mapping otomatis tidak dapat memastikan dua orang dengan nama sama. Periksa manual bila:

- Nama lead lama tidak sama dengan nama akun.
- Assignee memakai nama panggilan.
- Anggota belum mempunyai akun Firebase.
- Team member lama belum pernah disimpan dalam project.
