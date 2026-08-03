# Panduan Migrasi dari Versi Lama

V2 menggunakan model autentikasi baru. Migrasi harus dilakukan terkontrol dan selalu dimulai dengan backup Firestore.

## 1. Buat branch migrasi

```bash
git switch -c refactor/v2-secure-architecture
```

## 2. Backup Firestore

Gunakan export Firestore/Google Cloud sebelum menyentuh data produksi.

## 3. Compatibility data v1

V2.1 dapat membaca field project lama berikut:

- `projectName` sebagai `name`
- `projectLead` sebagai `lead`
- status `OVERDUE` sebagai project aktif yang indikator overdue-nya dihitung dari deadline
- tanggal string, ISO datetime, dan Firestore Timestamp

V2.1 juga membaca relation lama dari collection top-level:

- `tasks` berdasarkan `projectId`
- `comments` berdasarkan `projectId`
- `attachments` berdasarkan `projectId`
- `transactions` berdasarkan `projectId`

Task lama dengan field `assignedTo` dan `isCompleted` tetap dikenali.

## 4. Struktur write baru

Data baru ditulis ke:

- `projects/{projectId}/tasks/{taskId}`
- `projects/{projectId}/comments/{commentId}`
- `projects/{projectId}/attachments/{attachmentId}`

Transaksi tetap berada pada collection top-level karena dipakai pada laporan finance global.

Compatibility reader memungkinkan cutover bertahap. Setelah sistem stabil, buat migrasi khusus untuk memindahkan relation lama ke subcollection dan hapus data top-level hanya setelah hasilnya diverifikasi.

## 5. Migrasi user

Password Firestore lama tidak dipakai. Buat ulang user melalui Firebase Authentication dan beri custom claim role `ADMIN` atau `MEMBER`. Script `seed:admin` digunakan untuk admin pertama.

## 6. Uji di Firebase staging

Uji login, dashboard, detail project, drag-and-drop board, reorder task, comments, attachment, finance, dan penghapusan project sebelum memakai database produksi.
