# Status Verifikasi Paket v2.1

## Sudah diperiksa

- 40 file TypeScript/TSX lolos pemeriksaan sintaks dengan TypeScript 5.8.3.
- Seluruh import internal `@/` mengarah ke file yang tersedia.
- Parser tanggal diuji dengan date-only, ISO datetime, Firestore Timestamp object, Timestamp string, nilai kosong, dan nilai rusak.
- Nilai tanggal rusak menghasilkan `-`, bukan `RangeError`.
- JSON configuration valid.
- Script seed admin lolos pemeriksaan sintaks Node.js.
- Tidak ada `.env.local`, service-account asli, `node_modules`, atau build output di paket.
- Mutasi comment, attachment, task, status, project, dan finance melakukan autentikasi di server.
- Penghapusan berisiko memakai konfirmasi dan pemeriksaan ownership/admin di server.
- Tidak ada dependency baru untuk drag-and-drop, comments, atau attachment link.

## Yang wajib dijalankan di komputer pengguna

Registry npm pada lingkungan pembuat paket tidak menyediakan package scoped yang diperlukan, sehingga full production build tidak dapat dijalankan di sini. Jalankan pada komputer project:

```bash
npm run lint
npm run typecheck
npm run build
```

Karena `package.json` tidak menambah dependency, pengguna yang sudah menjalankan v2.0 tidak perlu menjalankan `npm install` ulang untuk patch v2.1.

## Verifikasi tambahan v2.1

- Compatibility reader menerima `techStack` sebagai array Firestore, JSON string, atau teks dipisahkan koma.
- Repository membaca task, komentar, dan attachment dari struktur nested v2 maupun collection top-level v1.
- Mutasi baru tetap menggunakan subcollection project dan pemeriksaan session server.
