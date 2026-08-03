# Audit Mendalam — Project-Manager-and-Tracker-WebApp

Tanggal audit: 3 Agustus 2026

## Ringkasan pedas

Versi lama terlihat kaya fitur, tetapi secara teknis lebih dekat ke demo besar daripada aplikasi internal yang aman. Masalah terbesarnya bukan tampilan, melainkan identitas user dapat dipalsukan, endpoint utama tidak konsisten dilindungi, pembacaan project memicu banyak query, dan satu file dashboard mencapai lebih dari seribu baris.

## Temuan kritis

### 1. Autentikasi palsu

- User disimpan utuh di `localStorage`.
- Backend mengambil identitas dari header `x-user-id` yang dikirim browser.
- Tidak ada token bertanda tangan, session cookie, atau verifikasi Firebase Auth.
- Pengguna dapat mengubah localStorage/header dan menyamar sebagai user lain.
- Hash SHA-256 untuk membandingkan role tidak memberi keamanan tambahan karena identitas awal sudah tidak terpercaya.

**Perbaikan v2:** Firebase Auth + ID token + session cookie HttpOnly + custom claims role.

### 2. API project terbuka

`GET /api/projects` dan `POST /api/projects` pada versi lama tidak melakukan pemeriksaan autentikasi. Orang yang dapat mengakses endpoint dapat membaca atau membuat data project.

### 3. Endpoint reset/seed terlalu berbahaya

- Endpoint reset menghapus semua collection, termasuk user.
- Endpoint seed membuat akun demo `admin@nextylab.com` dengan password yang diketahui umum.
- Mode bootstrap membolehkan seed tanpa autentikasi saat collection user kosong.
- Endpoint operasional semacam ini tidak layak tinggal di aplikasi produksi.

**Perbaikan v2:** endpoint dihapus; admin dibuat lewat script lokal `npm run seed:admin`.

## Temuan arsitektur

### 4. Next.js dipakai seperti SPA manual

Seluruh halaman dirender dari `app/page.tsx`, lalu view diganti dengan state lokal. Dampaknya:

- URL tidak merepresentasikan halaman.
- Tombol back/forward browser tidak natural.
- Deep link project tidak tersedia.
- Refresh pada detail project kehilangan konteks.
- File root menjadi router kedua yang seharusnya tidak diperlukan.

**Perbaikan v2:** route `/dashboard`, `/projects`, `/projects/[id]`, `/board`, `/finance`, dan `/settings`.

### 5. Adapter Firestore 600+ baris meniru Prisma

`lib/db.ts` membuat API mirip Prisma di atas Firestore. Ini menambah abstraksi tanpa manfaat nyata, menyembunyikan biaya query, dan menghasilkan banyak tipe `Record<string, unknown>` serta cast.

**Perbaikan v2:** repository kecil per domain (`projects`, `transactions`) dengan fungsi yang eksplisit.

### 6. N+1 query dan sorting di memory

Daftar project memuat tasks, attachments, transactions, comments, dan logs satu per satu untuk setiap project. Lima project dapat memicu puluhan query. Sorting dilakukan di server memory untuk menghindari index, yang merupakan optimasi semu.

**Perbaikan v2:** halaman list hanya mengambil field project; relasi dimuat hanya di halaman detail. Query menggunakan `orderBy` dan index normal.

### 7. Mutasi saat membaca data

Versi lama mengubah status menjadi `OVERDUE` ketika project dibaca. GET seharusnya tidak diam-diam menulis database. Ini menambah biaya, membuat cache tidak stabil, dan mempersulit debugging.

**Perbaikan v2:** overdue dihitung sebagai state turunan di UI; status bisnis tetap eksplisit.

### 8. Replace-all tasks dan attachments

Mengedit satu task dapat menghapus lalu membuat ulang seluruh daftar. Ini boros write, rawan race condition, dan buruk untuk audit trail.

**Perbaikan v2:** satu dokumen task diubah per operasi.

## Temuan kualitas kode

### 9. God components

- `DashboardView.tsx`: sekitar 1.014 baris.
- `ProjectsView.tsx`: sekitar 831 baris.
- `ProjectDetailView.tsx`: sekitar 476 baris.
- `BoardView.tsx`: sekitar 441 baris.

Komponen sebesar ini menggabungkan query, kalkulasi bisnis, chart, event, format data, dan tampilan. Sulit dites dan mudah rusak.

### 10. Dependency bengkak

Versi lama memasang dua sistem drag-and-drop (`@dnd-kit` dan `@hello-pangea/dnd`), Recharts, Framer Motion, Socket.IO, React Query, Zustand, serta banyak komponen Radix. Banyak dependency hanya mendukung kenyamanan kecil, tetapi menambah ukuran install, permukaan bug, dan beban upgrade.

### 11. Realtime yang tidak perlu

Setelah mutation, aplikasi sudah melakukan invalidasi React Query, lalu masih mengirim event Socket.IO. Untuk tim kecil, ini duplikasi kompleksitas. Bila realtime benar-benar dibutuhkan, gunakan Firestore listener atau event server yang memiliki autentikasi dan authorization.

### 12. Data model tidak konsisten

`techStack` disimpan sebagai JSON string lalu diubah kembali menjadi array. Firestore mendukung array secara native. Pola ini meningkatkan kemungkinan data rusak tanpa alasan.

## Fitur yang kurang berguna atau berlebihan

- Chart dashboard terlalu banyak untuk sistem internal kecil; metrik inti dan daftar tindakan lebih berguna.
- Animasi halaman tidak memberi nilai operasional.
- Command palette dan keyboard shortcut layak hanya bila user aktif memang membutuhkannya.
- CSV import sebaiknya ditunda sampai ada preview, mapping kolom, validasi, dan rollback.
- Reset data demo dari Settings harus dihapus dari production.
- Activity realtime buatan sendiri tidak sebanding dengan biaya pemeliharaannya.

## Prioritas perbaikan

1. Ganti autentikasi dan lindungi seluruh akses data.
2. Hapus endpoint reset/seed dari runtime.
3. Pecah route dan hilangkan router state manual.
4. Ganti `lib/db.ts` dengan repository domain.
5. Hilangkan N+1 query dan write saat GET.
6. Pangkas dependency.
7. Pecah god components.
8. Tambahkan test unit/integrasi setelah data layer stabil.

## File/folder lama yang sebaiknya dihapus atau diganti

| Path lama | Keputusan | Alasan |
|---|---|---|
| `stores/auth-store.ts` | Hapus | Menjadikan data `localStorage` sebagai sumber kebenaran autentikasi. |
| `lib/auth.ts` | Ganti total | Auth password custom dan identitas dari `x-user-id` tidak layak dipakai sebagai session. |
| `app/api/auth/route.ts` | Hapus | Diganti Firebase Auth dan endpoint pertukaran ID token menjadi cookie sesi. |
| `app/api/reset/route.ts` | Hapus | Operasi penghancur database tidak boleh menjadi endpoint aplikasi produksi. |
| `app/api/seed/route.ts` | Hapus | Seed runtime dan password demo default memperbesar risiko takeover. |
| `lib/db.ts` | Pecah | Adapter 600+ baris meniru ORM dan menyembunyikan biaya query Firestore. |
| `lib/firebase.ts` | Ganti | Client Firestore tidak diperlukan saat seluruh akses data lewat server terpercaya. |
| `lib/socket.ts` dan `mini-services/activity-ws/` | Hapus | Realtime ganda setelah cache invalidation tidak sebanding dengan kompleksitas operasional. |
| `hooks/useProjects.ts` dan hook API sejenis | Ganti | Lapisan fetch/cache/socket terlalu tebal untuk CRUD internal kecil. |
| `hooks/use-toast.ts` + `components/ui/toast.tsx` | Hapus salah satu sistem | Project juga memakai Sonner; dua sistem toast adalah duplikasi. |
| `app/page.tsx` versi lama | Ganti total | File ini bertindak sebagai router manual berbasis state. |
| `components/views/DashboardView.tsx` | Pecah/ganti | God component sekitar seribu baris. |
| `components/views/ProjectsView.tsx` | Pecah/ganti | Menggabungkan tabel, filter, import, form, query, dan mutasi. |
| `components/views/ProjectDetailView.tsx` | Pecah/ganti | Detail, task, finance, komentar, dan lampiran bercampur. |
| `components/views/BoardView.tsx` | Ganti | Board tidak membutuhkan state/router dan dependency DnD berlapis. |
| `bun.lock` | Hapus bila standar tim npm | Dua package manager menyebabkan lockfile dan dependency tree berbeda. |
| `Caddyfile`, `.zscripts/`, `worklog.md` | Review lalu arsipkan | Simpan hanya bila benar-benar dipakai pada deployment atau proses tim saat ini. |

## Penyesuaian setelah evaluasi pengguna (v2.1)

Evaluasi lanjutan menunjukkan bahwa tiga fitur lama memang memberi nilai operasional langsung dan layak dipertahankan: board drag-and-drop, komentar project, serta attachment link. Ketiganya dikembalikan pada v2.1 dengan implementasi yang lebih kecil dan tetap memakai authorization server. Drag-and-drop menggunakan HTML5 native tanpa dua library DnD sekaligus; komentar mengambil identitas dari session terverifikasi; attachment dibatasi pada tautan `http/https` dan menyimpan creator.

Fitur yang tetap ditunda adalah duplicate project, import CSV, activity log realtime, command palette, animasi halaman, tema ganda, dan Socket.IO. Fitur-fitur tersebut baru layak ditambahkan setelah ada kebutuhan pengguna yang terukur, acceptance criteria, authorization, dan test yang jelas.
