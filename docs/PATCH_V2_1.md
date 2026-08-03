# Patch v2.1 — Legacy UI, DnD, Comments, Attachments, Date Fix

## Perubahan

1. Memperbaiki `RangeError: Invalid time value` pada dashboard dan halaman lain.
2. Parser tanggal sekarang menerima:
   - `YYYY-MM-DD`
   - ISO datetime
   - JavaScript `Date`
   - Firestore `Timestamp` object
   - representasi string `Timestamp(seconds=...)`
3. Nilai tanggal rusak tidak lagi menjatuhkan halaman; UI menampilkan `-`.
4. Mengembalikan gaya visual compact dark yang mendekati desain versi lama.
5. Mengembalikan drag-and-drop board project menggunakan HTML5 native.
6. Menambahkan drag-and-drop urutan task dan kontrol naik/turun sebagai fallback.
7. Menambahkan comments per project.
8. Menambahkan attachment link per project.
9. Menambahkan compatibility reader untuk struktur data v1:
   - `tasks/{taskId}` dengan `projectId`
   - `comments/{commentId}` dengan `projectId`
   - `attachments/{attachmentId}` dengan `projectId`
10. Data v2.1 baru tetap ditulis ke subcollection project agar struktur baru tetap rapi.

## Cara memasang patch

Tutup development server, lalu salin seluruh isi patch ke root project dan izinkan replace file.

Dependency tidak berubah, jadi tidak perlu `npm install` ulang.

```bash
npm run dev
```

Lakukan hard refresh pada browser setelah server aktif kembali.

## Verifikasi

```bash
npm run lint
npm run typecheck
npm run build
```

## Catatan data lama

V2.1 membaca data lama dan baru sekaligus. Ini membuat project lama langsung dapat dipakai tanpa migrasi darurat. Untuk jangka panjang, data top-level v1 sebaiknya dipindahkan ke subcollection project setelah backup dan staging test selesai.
