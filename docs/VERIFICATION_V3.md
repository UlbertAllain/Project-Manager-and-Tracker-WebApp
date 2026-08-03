# Verification v3

## Pemeriksaan otomatis yang tersedia di source

```bash
npm run check
```

Menjalankan:

1. ESLint.
2. TypeScript typecheck.
3. Production build Next.js.

## Checklist manual

### Admin

- Login berhasil.
- Dapat membuka Team dan Finance.
- Dapat membuat akun PM/member.
- Dapat membuat project.
- Dapat menghapus project dan transaksi.

### Project Manager

- Tidak dapat membuka Finance.
- Dapat membuat project.
- Dapat mengelola project yang dipimpin.
- Dapat membuat task dan assignment.
- Dapat memindahkan project/task.
- Dapat membuka Reports dan Team.

### Member

- Tidak melihat tombol membuat project.
- Tidak dapat membuka Team, Reports, atau Finance.
- My Work hanya menampilkan task terkait.
- Hanya dapat memindahkan task sendiri.
- Dapat menulis laporan dan attachment pada project terkait.

### Kolaborasi

- Comment dapat dipilih untuk task tertentu.
- Attachment dapat dipilih untuk task tertentu.
- Activity log bertambah setelah perubahan penting.
- Progress project dihitung ulang dari task berstatus DONE.

### Responsif

Periksa desktop, tablet, dan mobile untuk:

- Sidebar/navigation.
- Dashboard.
- Project board.
- My Work.
- Project detail.
- Form project.

## Hasil verifikasi paket yang diberikan

Pemeriksaan yang berhasil dijalankan pada source final:

- 47 file TypeScript/TSX lolos pemeriksaan syntax menggunakan TypeScript transpiler.
- Seluruh import internal `@/` ditemukan.
- Tidak ditemukan event handler pada Server Component.
- JSON valid dan struktur kurung CSS seimbang.
- `seed-admin.mjs` serta `migrate-v3.mjs` lolos `node --check`.
- Parser tanggal diuji dengan date-only, ISO datetime, Firestore seconds, nilai kosong, dan nilai rusak.
- Pemindaian dasar tidak menemukan private key/API key asli.
- ZIP full dan patch lolos integrity test.

Production build belum dapat dijalankan di lingkungan packaging karena registry npm internal mengembalikan `404` saat mengambil `@types/node`. Jalankan `npm run check` pada komputer lokal setelah source dipasang. Tidak ada dependency baru dibanding v2.1.
