# Nexty Labs Project Tracker

Nexty Labs Project Tracker adalah aplikasi manajemen project internal berbasis Next.js, Firebase Firestore, React Query, Zustand, dan Socket.IO. Aplikasi ini dirancang untuk membantu tim kecil mengelola project klien, task, status pengerjaan, transaksi, komentar, lampiran link, aktivitas, dan ringkasan dashboard.

Fitur AI pernah ada di project ini, tetapi sudah dicabut agar aplikasi lebih stabil untuk demo lokal, sidang, dan deployment tanpa dependency API eksternal.

## Ringkasan Fitur

- Autentikasi sederhana berbasis data user di Firestore.
- Dashboard portfolio project:
  - total project
  - project aktif
  - revenue
  - overdue
  - completed rate
  - total expense
  - chart revenue dan expense
  - distribusi status
  - budget per kategori
  - project health score
  - aktivitas terbaru
  - timeline deadline
  - list `Butuh Perhatian Hari Ini`
  - perbandingan bulanan
- CRUD project:
  - tambah project
  - edit project
  - hapus project
  - duplicate project
  - import project dari CSV
  - export CSV
- Detail project:
  - status dan progress
  - task list dengan drag and drop
  - assignment task ke anggota/tanggung jawab tertentu
  - due date per task
  - edit task inline
  - finance section
  - komentar
  - activity log
  - link attachment
- Board/Kanban:
  - drag and drop project antar status
  - quick status update dari list view
- Finance global:
  - daftar transaksi semua project
  - filter transaksi berdasarkan project/tanggal
- Settings:
  - update nama user
  - tema light/dark/system
  - preference UI
  - reset data demo
  - logout
- Reporting:
  - download laporan CSV portfolio project dari dashboard
  - ringkasan budget, paid amount, expense, task progress, dan deadline
- Deadline & Reminder:
  - indikator deadline aman, mendekat, hari ini, dan overdue
  - notifikasi internal untuk deadline mendekat, deadline hari ini, overdue, dan pembayaran belum lunas
  - notifikasi internal untuk task due hari ini dan task overdue
  - auto status `OVERDUE` jika project aktif melewati deadline
  - panel `Butuh Perhatian Hari Ini` di Dashboard
- Realtime sync ringan via Socket.IO mini-service.

## Tech Stack

- Framework: Next.js App Router
- Bahasa: TypeScript
- UI: React, Tailwind CSS, shadcn/ui style components, Radix UI
- State client: Zustand
- Server state/cache: TanStack React Query
- Database: Firebase Firestore via Firebase Admin SDK
- Realtime event: Socket.IO mini-service
- Chart: Recharts
- Drag and drop:
  - `@dnd-kit/*` untuk task reorder
  - native drag event untuk board project
- Validasi: Zod
- Notifikasi: Sonner

## Struktur Folder

```text
.
├── app/
│   ├── api/
│   │   ├── auth/
│   │   ├── comments/
│   │   ├── logs/
│   │   ├── projects/
│   │   ├── reset/
│   │   ├── seed/
│   │   └── transactions/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── import/
│   ├── layout/
│   ├── notifications/
│   ├── project/
│   ├── providers/
│   ├── search/
│   ├── shortcuts/
│   ├── ui/
│   └── views/
├── hooks/
├── lib/
│   ├── constants/
│   ├── helpers/
│   ├── schemas/
│   ├── utils/
│   ├── db.ts
│   ├── firebase.ts
│   ├── firebase-admin.ts
│   ├── socket.ts
│   └── types.ts
├── mini-services/
│   └── activity-ws/
├── public/
├── stores/
├── package.json
└── tsconfig.json
```

## Arsitektur Singkat

Frontend berjalan di `app/page.tsx` sebagai single-page dashboard di dalam Next.js App Router. Navigasi antar view disimpan di state lokal, bukan route terpisah.

Dokumentasi data layer yang lebih formal ada di `docs/FIRESTORE.md`.

Alur umumnya:

1. User login melalui `LoginView`.
2. Data user disimpan di Zustand store dan `localStorage`.
3. App menampilkan `AppShell` dengan sidebar, command palette, dan view aktif.
4. Data project/transaksi/log diambil via React Query.
5. Hook React Query memanggil API route di `app/api/*`.
6. API route memakai adapter `lib/db.ts`.
7. Adapter `lib/db.ts` menerjemahkan operasi mirip Prisma ke Firestore Admin SDK.
8. Setelah mutation berhasil, React Query invalidate cache dan Socket.IO mengirim event realtime ringan.

## Data Model

Tipe utama berada di `lib/types.ts`.

### Project

Field utama:

- `id`
- `projectName`
- `clientName`
- `projectLead`
- `description`
- `status`
- `priority`
- `category`
- `techStack`
- `startDate`
- `deadline`
- `completedDate`
- `budget`
- `paidAmount`
- `totalExpense`
- `paymentStatus`
- `progress`
- `notes`
- `createdAt`
- `updatedAt`
- `tasks`
- `attachments`
- `transactions`
- `comments`
- `logs`

### Task

- `id`
- `title`
- `assignedTo`
- `dueDate`
- `isCompleted`
- `order`
- `projectId`

### LinkAttachment

- `id`
- `title`
- `url`
- `platform`
- `projectId`

### Transaction

- `id`
- `type`: `INCOME` atau `EXPENSE`
- `amount`
- `description`
- `date`
- `projectId`
- `createdAt`
- optional `project`

### Comment

- `id`
- `userEmail`
- `message`
- `projectId`
- `createdAt`

### ActivityLog

- `id`
- `action`
- `message`
- `projectId`
- `timestamp`

### AuthUser

- `id`
- `email`
- `name`
- `role`

## Firestore Collections

Firestore memakai collection berikut:

- `users`
- `projects`
- `tasks`
- `attachments`
- `transactions`
- `comments`
- `activityLogs`

Relasi tidak disimpan sebagai nested document. Setiap child collection memiliki `projectId`, lalu adapter `lib/db.ts` mengambil data relasi dengan query `where('projectId', '==', projectId)`.

## Catatan Adapter Firestore

File `lib/db.ts` dibuat sebagai adapter agar API route bisa memakai pola mirip Prisma, contohnya:

```ts
await db.project.findMany({
  include: {
    tasks: true,
    transactions: true,
  },
});
```

Beberapa keputusan teknis:

- Sorting banyak dilakukan di memory, bukan `orderBy` Firestore, untuk menghindari kebutuhan composite index saat development.
- `techStack` disimpan sebagai JSON string di Firestore, tetapi dikembalikan sebagai `string[]` ke frontend.
- Update `tasks` dan `attachments` memakai strategi replace seluruh list per project.
- ID task dan attachment dipertahankan agar React key stabil dan drag/drop tidak error.
- Saat project dibaca dari Firestore, adapter akan menandai project aktif sebagai `OVERDUE` jika deadline kalendernya sudah lewat.
- Dokumentasi schema, indexing strategy, pagination, dan migration ada di `docs/FIRESTORE.md`.
- Operasi batch besar dipecah per 450 operasi untuk menjaga batas Firestore batch.

## Setup Lokal

### 1. Install dependency

```bash
npm install
```

Project ini juga memiliki `bun.lock`, tetapi script utama root memakai npm. Gunakan satu package manager secara konsisten agar lockfile tidak bertabrakan.

### 2. Siapkan environment

Buat `.env.local` atau `.env` dengan variabel berikut:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

FIREBASE_SERVICE_ACCOUNT=
```

`FIREBASE_SERVICE_ACCOUNT` opsional jika environment sudah memakai Application Default Credentials atau emulator. Jika dipakai, isinya berupa JSON service account dalam bentuk string.

Contoh format:

```env
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}
```

Pastikan private key di-escape dengan benar jika ditulis satu baris.

### 3. Jalankan aplikasi

```bash
npm run dev
```

Default app berjalan di:

```text
http://localhost:3000
```

### 4. Seed data demo

Setelah Firebase siap, buka aplikasi lalu gunakan tombol reset data di Settings, atau panggil endpoint:

```bash
curl -X POST http://localhost:3000/api/seed
```

Seed membuat user demo:

```text
Email: admin@nextylab.com
Password: admin123
Role: ADMIN
```

Password demo disimpan sebagai hash `scrypt` saat seed baru dibuat. Jika database lama masih memiliki password plain text, sistem login akan tetap menerima password lama lalu otomatis memigrasikan password tersebut menjadi hash setelah login berhasil.

## Mini-Service Realtime

Realtime activity memakai mini-service Socket.IO di:

```text
mini-services/activity-ws
```

Port default:

```text
3003
```

Menjalankan mini-service:

```bash
cd mini-services/activity-ws
npm install
npm run dev
```

Catatan:

- Package mini-service memakai Bun di script `dev`.
- Client socket berada di `lib/socket.ts`.
- Client connect melalui `/?XTransformPort=3003`, sesuai environment/proxy development yang digunakan project ini.
- Jika realtime tidak berjalan, fitur utama tetap bisa digunakan; hanya auto-refresh/event realtime yang berkurang.

## Script NPM

```bash
npm run dev
```

Menjalankan Next.js development server di port 3000.

```bash
npm run build
```

Membuat production build.

```bash
npm run start
```

Menjalankan production server setelah build.

```bash
npm run lint
```

Menjalankan ESLint untuk seluruh project.

Untuk typecheck manual:

```bash
npx tsc --noEmit
```

Audit data Firestore tanpa mengubah data:

```bash
npm run audit:data
```

Memperbaiki field default/format lama yang aman dimigrasikan:

```bash
npm run migrate:data
```

## API Routes

Semua endpoint berada di `app/api`.

### Auth

#### `POST /api/auth`

Login user.

Body:

```json
{
  "email": "admin@nextylab.com",
  "password": "admin123"
}
```

Response sukses:

```json
{
  "data": {
    "id": "...",
    "email": "admin@nextylab.com",
    "name": "Admin Nexty Labs",
    "role": "ADMIN"
  }
}
```

Catatan keamanan:

- Password diverifikasi melalui helper di `lib/auth.ts`.
- Password lama plain text masih didukung untuk migrasi.
- Setelah login sukses, password plain text akan diganti menjadi hash.

### Users

#### `GET /api/users`

Mengambil daftar user tanpa field password. Data ini dipakai untuk:

- dropdown project lead
- dropdown task assignee
- daftar user di Settings

#### `POST /api/users`

Membuat user baru. Endpoint ini membutuhkan role `ADMIN`.

Header:

```text
x-user-id: {adminUserId}
```

Body:

```json
{
  "email": "staff@nextylab.com",
  "name": "Staff Nexty Labs",
  "password": "minimal6",
  "role": "STAFF"
}
```

Role yang tersedia:

- `ADMIN`
- `PROJECT_LEAD`
- `STAFF`

#### `PATCH /api/auth/profile`

Update profil user.

Body:

```json
{
  "userId": "...",
  "name": "Nama Baru"
}
```

### Projects

#### `GET /api/projects`

Mengambil semua project beserta relasi penting.

Query pagination opsional:

```text
page
limit
```

Contoh:

```text
/api/projects?page=1&limit=20
```

Jika pagination dipakai, response menyertakan object `pagination`.

#### `POST /api/projects`

Membuat project baru.

Body minimal:

```json
{
  "projectName": "Website Company Profile",
  "clientName": "PT Contoh",
  "techStack": ["Next.js", "Firebase"],
  "budget": 5000000
}
```

#### `GET /api/projects/[id]`

Mengambil detail satu project beserta:

- tasks
- attachments
- transactions
- comments
- logs

#### `PATCH /api/projects/[id]`

Update data project.

Bisa update field dasar project, serta mengganti list `tasks` dan `attachments`.

#### `DELETE /api/projects/[id]`

Menghapus project beserta data relasinya:

- tasks
- attachments
- transactions
- comments
- logs

Endpoint ini membutuhkan user dengan role `ADMIN`. Client mengirim `x-user-id`, lalu server mengambil role user dari Firestore.

#### `POST /api/projects/[id]/duplicate`

Menduplikasi project. Task ikut disalin, tetapi status pembayaran, progress, dan transaksi di-reset.

#### `POST /api/projects/import`

Import beberapa project sekaligus.

Body:

```json
{
  "projects": [
    {
      "projectName": "Project A",
      "clientName": "Client A",
      "budget": 1000000
    }
  ]
}
```

### Transactions

#### `GET /api/transactions`

Mengambil transaksi global.

Query opsional:

```text
projectId
startDate
endDate
page
limit
```

Contoh:

```text
/api/transactions?projectId=abc&startDate=2026-01-01&endDate=2026-01-31
```

Contoh pagination:

```text
/api/transactions?page=1&limit=20
```

#### `POST /api/transactions`

Membuat transaksi baru.

Body:

```json
{
  "projectId": "...",
  "type": "INCOME",
  "amount": 1000000,
  "description": "DP project",
  "date": "2026-06-24"
}
```

Setelah transaksi dibuat, project akan menghitung ulang:

- `paidAmount`
- `totalExpense`
- `paymentStatus`

#### `PATCH /api/transactions/[id]`

Update transaksi.

#### `DELETE /api/transactions/[id]`

Hapus transaksi dan hitung ulang finance project.

### Comments

#### `GET /api/comments?projectId=...`

Mengambil komentar untuk project tertentu.

#### `POST /api/comments`

Menambah komentar.

Body:

```json
{
  "projectId": "...",
  "userEmail": "admin@nextylab.com",
  "message": "Komentar project"
}
```

### Logs

#### `GET /api/logs`

Mengambil activity log global terbaru.

Mendukung pagination:

```text
/api/logs?page=1&limit=20
```

#### `GET /api/logs?projectId=...`

Mengambil activity log untuk project tertentu.

Mendukung pagination:

```text
/api/logs?projectId=abc&page=1&limit=20
```

### Seed & Reset

#### `POST /api/seed`

Menghapus data lama lalu membuat data demo.

Jika database masih kosong, endpoint ini bisa dipakai untuk bootstrap user pertama. Jika sudah ada user, endpoint ini membutuhkan role `ADMIN`.

#### `DELETE /api/reset`

Menghapus semua data dari collection utama tanpa membuat data demo baru.

Endpoint ini membutuhkan role `ADMIN`.

### Reports

#### `GET /api/reports/projects`

Menghasilkan laporan portfolio project dalam format CSV.

Kolom laporan:

- Project
- Client
- Lead
- Status
- Priority
- Category
- Progress
- Budget
- Paid
- Expense
- Payment Status
- Task Done
- Task Total
- Task Overdue
- Task Due Today
- Start Date
- Deadline
- Completed Date

Endpoint ini dipakai oleh tombol `Laporan CSV` di Dashboard.

## Flow Penggunaan Aplikasi

### Login

1. Jalankan app.
2. Seed data demo jika database kosong.
3. Login dengan user demo atau user yang ada di Firestore.
4. Auth state disimpan di Zustand dan `localStorage`.

### Membuat Project

1. Buka view Projects.
2. Klik tambah project.
3. Isi nama project, client, project lead, kategori, prioritas, budget, deadline, dan tech stack.
4. Simpan.
5. Activity log otomatis dibuat.

Jika data user sudah tersedia, project lead dipilih dari dropdown user. Nilai yang disimpan adalah email user agar assignment stabil meskipun nama user berubah.

### Mengelola Task

1. Buka detail project.
2. Tab Overview berisi task.
3. Tambah task dari input.
4. Isi assignee opsional pada field `Assign ke...`.
5. Isi due date task jika task punya tenggat spesifik.
6. Klik icon check untuk toggle selesai.
7. Double click task atau klik icon edit untuk rename.
8. Ubah due date task dari date picker kecil di baris task.
9. Drag handle untuk reorder.
10. Progress dihitung ulang dari task selesai.

Jika data user tersedia, assignee task dipilih dari dropdown. Tampilan task akan menampilkan nama user berdasarkan email assignee.

Task yang belum selesai akan diberi indikator jika:

- due date jatuh pada hari ini
- due date sudah lewat
- due date tinggal 1-3 hari

### Filter Project Saya

1. Buka halaman Projects.
2. Gunakan filter lead di sebelah filter status.
3. Pilih `Project Saya`.
4. Sistem menampilkan project yang `projectLead`-nya sama dengan email atau nama user yang sedang login.

### Mengelola Keuangan

1. Buka detail project tab Finance, atau view Finance global.
2. Tambah transaksi `INCOME` atau `EXPENSE`.
3. Project otomatis menghitung:
   - total pembayaran
   - total pengeluaran
   - status pembayaran
4. Jika income >= budget, payment status menjadi `PAID`.
5. Jika income > 0 tapi kurang dari budget, status menjadi `PARTIAL`.
6. Jika belum ada income, status menjadi `UNPAID`.

### Menggunakan Board

1. Buka Board.
2. Drag project ke kolom status lain.
3. Status project diperbarui.
4. Jika status menjadi `COMPLETED`, progress diset ke 100 dan completed date diisi otomatis.

### Deadline dan Reminder

Sistem deadline memakai perhitungan tanggal kalender agar deadline hari ini tidak dianggap terlambat hanya karena perbedaan jam.

Status deadline:

- `SAFE`: deadline masih aman atau project sudah selesai/dibatalkan.
- `DUE_SOON`: deadline tersisa 1-3 hari.
- `DUE_TODAY`: deadline jatuh pada hari ini.
- `OVERDUE`: deadline sudah lewat.

Perilaku otomatis:

- Project dengan status aktif akan otomatis berubah menjadi `OVERDUE` saat data project dibaca jika deadline sudah lewat.
- Project `COMPLETED` dan `CANCELLED` tidak akan diubah menjadi overdue.
- Notifikasi internal dibuat dari data project aktif:
  - deadline mendekat
  - deadline hari ini
  - project overdue
  - pembayaran belum masuk atau belum lunas
- Dashboard menampilkan panel `Butuh Perhatian Hari Ini` berisi project yang perlu ditangani karena:
  - deadline sudah lewat
  - deadline hari ini
  - deadline tinggal beberapa hari
  - pembayaran belum masuk/belum lunas
  - progress masih rendah saat deadline dekat
  - ada task overdue
  - ada task due hari ini

### Import Project

Import CSV diproses oleh utilitas di:

```text
lib/utils/importCsv.ts
```

Export CSV berada di:

```text
lib/utils/exportCsv.ts
```

### Download Laporan Project

1. Buka Dashboard.
2. Klik tombol `Laporan CSV`.
3. Browser akan membuka/mengunduh file CSV dari `/api/reports/projects`.
4. File bisa dibuka di Excel, Google Sheets, atau aplikasi spreadsheet lain.

## Validasi Input

Schema validasi berada di:

```text
lib/schemas/index.ts
```

Schema utama:

- `createProjectSchema`
- `updateProjectSchema`
- `taskSchema`
- `linkAttachmentSchema`
- `createTransactionSchema`
- `updateTransactionSchema`
- `commentSchema`
- `activityLogSchema`

API route harus memakai schema ini sebelum menulis ke Firestore.

## State Management

### Zustand Stores

Lokasi:

```text
stores/
```

Store yang tersedia:

- `auth-store.ts`: user login dan auth status
- `notification-store.ts`: state notifikasi
- `preferences-store.ts`: preferensi tampilan dan UI

### React Query Hooks

Lokasi:

```text
hooks/
```

Hook utama:

- `useProjects`
- `useProject`
- `useTransactions`
- `useComments`
- `useActivityLogs`
- `useDuplicateProject`
- `useActivitySocket`
- `useKeyboardShortcuts`

React Query bertanggung jawab untuk:

- fetching data
- caching
- invalidation setelah mutation
- optimistic update pada beberapa flow

## Styling dan UI

Global style:

```text
app/globals.css
```

Komponen UI reusable:

```text
components/ui/
```

Project memakai Tailwind CSS dan token warna custom:

- `base-bg`
- `base-card`
- `base-hover`
- `base-border`
- `brand-primary`
- `brand-accent`
- `text-main`
- `text-muted`
- `text-subtle`

Theme switching memakai `next-themes`.

## Keamanan dan Catatan Produksi

Beberapa hal yang perlu diperhatikan sebelum produksi:

- Auth saat ini masih sederhana, tetapi password sudah didukung hash `scrypt`.
- Untuk produksi, tetap lebih direkomendasikan memakai Firebase Auth atau auth provider yang matang.
- Endpoint `/api/seed`, `/api/reset`, dan delete project sudah diproteksi role `ADMIN` secara server-side melalui `x-user-id`.
- Endpoint pembuatan user juga diproteksi role `ADMIN`.
- Pembatasan role di UI sudah tersedia, tetapi beberapa mutation project masih perlu hardening server-side lebih granular sebelum production.
- Header `x-user-id` cukup untuk kebutuhan aplikasi internal/demo, tetapi untuk produksi harus diganti token/session yang tidak mudah dipalsukan.
- Firestore security rules tetap perlu dikonfigurasi jika client SDK dipakai langsung.
- Service account jangan pernah commit ke repository.
- `.env` dan `.env.local` sudah masuk `.gitignore`.

## Riwayat Pengembangan

Mulai bagian ini, perubahan project dicatat per tanggal agar jelas fitur apa yang ditambah, dikurangi, dan file/bagian mana yang terkena.

### 25 Juni 2026

Ditambahkan:

- Prioritas 5: database & query maturity.
- Dokumentasi Firestore lengkap di `docs/FIRESTORE.md`:
  - schema collection
  - query strategy
  - pagination API
  - indexing strategy
  - audit dan migration data
- Helper pagination di `lib/pagination.ts`.
- Pagination backward-compatible untuk:
  - `GET /api/projects`
  - `GET /api/transactions`
  - `GET /api/logs`
- Script audit data Firestore:
  - `npm run audit:data`
  - `npm run migrate:data`
- Script `scripts/audit-firestore-data.mjs` untuk validasi data lama dan migrasi field aman.
- Prioritas 4: task due date.
- Field `dueDate` pada tipe `Task` di `lib/types.ts`.
- Validasi `dueDate` task di `lib/schemas/index.ts`.
- Penyimpanan `dueDate` task di adapter Firestore `lib/db.ts`.
- Helper `getTaskDueInfo` di `lib/helpers/index.ts`.
- Input due date saat menambah task di `components/project/TaskSection.tsx`.
- Date picker kecil untuk mengubah due date task yang sudah ada.
- Indikator visual task:
  - task due hari ini
  - task overdue
  - task mendekati due date
- Notifikasi internal:
  - `Task Due Hari Ini`
  - `Task Overdue`
- Panel `Butuh Perhatian Hari Ini` di Dashboard sekarang ikut menghitung task due hari ini dan task overdue.
- Laporan CSV project menambahkan kolom:
  - `Task Overdue`
  - `Task Due Today`

Diperbaiki:

- Batched writes di `lib/db.ts` dibuat lebih aman dengan chunk 450 operasi.
- Delete project dan replace task/attachment tidak lagi bergantung pada satu batch besar.
- Semua handler update task di `components/views/ProjectDetailView.tsx` sekarang mempertahankan `dueDate` saat toggle, delete, edit, dan reorder task.

Dikurangi/dihapus:

- Belum ada penghapusan fitur pada tanggal ini.

### 24 Juni 2026

Ditambahkan:

- Deadline management lebih detail:
  - status project baru `OVERDUE`
  - helper `getDeadlineInfo` di `lib/helpers/index.ts`
  - auto status overdue di `lib/db.ts`
  - panel `Butuh Perhatian Hari Ini` di `components/views/DashboardView.tsx`
  - notifikasi `Deadline Hari Ini` dan overdue yang lebih jelas di `stores/notification-store.ts`
- Role dan user management:
  - API `/api/users`
  - form tambah user di Settings
  - role `ADMIN`, `PROJECT_LEAD`, `STAFF`
  - dropdown project lead dan task assignee berbasis user
- Reporting:
  - endpoint `/api/reports/projects`
  - tombol `Laporan CSV` di Dashboard
- Keamanan dasar:
  - password hashing dengan `scrypt`
  - migrasi otomatis password lama saat login
  - guard role `ADMIN` untuk seed/reset/delete project

Diperbaiki:

- Bug task dobel dan warning React duplicate key saat menambah task.
- Stabilitas ID task dan attachment saat update project.
- Filter `Project Saya` pada halaman Projects.
- Pembatasan UI berbasis role untuk create/edit/delete/import project.

Dikurangi/dihapus:

- Seluruh fitur AI:
  - `/api/ai/chat`
  - `/api/ai/generate-cover`
  - `/api/ai/insights`
  - floating AI assistant
  - AI insights dashboard
  - dependency AI terkait

Roadmap pengembangan berikutnya:

- Ganti auth sederhana menjadi Firebase Auth/session token.
- Tambah permission server-side yang lebih granular untuk setiap mutation.
- Tambah export PDF.
- Tambah test otomatis untuk helper finance, progress, dan API route.

## Fitur AI

Fitur AI sudah dihapus sepenuhnya.

Yang sudah dicabut:

- `/api/ai/chat`
- `/api/ai/generate-cover`
- `/api/ai/insights`
- floating AI assistant
- AI insights dashboard
- AI cover generator
- dependency AI terkait

Alasan:

- mengurangi kebutuhan API key eksternal
- membuat demo lebih stabil
- mengurangi risiko error saat offline
- menjaga scope aplikasi tetap fokus sebagai project tracker

## Troubleshooting

### Build gagal karena Firebase Admin

Pastikan env Firebase tersedia:

```env
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
FIREBASE_SERVICE_ACCOUNT=
```

Jika tidak memakai service account, pastikan environment mendukung Application Default Credentials atau emulator.

### Login gagal

Pastikan data user sudah ada. Jalankan:

```bash
curl -X POST http://localhost:3000/api/seed
```

Lalu login:

```text
admin@nextylab.com
admin123
```

### Realtime tidak jalan

Pastikan mini-service Socket.IO berjalan di port 3003.

Jika mini-service mati, aplikasi tetap berjalan, tetapi update realtime antar tab/client tidak aktif.

### Task muncul dobel atau warning duplicate key

Bug ini sudah diperbaiki dengan mempertahankan ID task saat update. Jika muncul lagi, cek apakah payload task masih membawa `id`.

### Firestore minta composite index

Sebagian besar query sengaja tidak memakai `orderBy` Firestore dan sorting dilakukan di memory. Jika menambah query baru dengan kombinasi `where` dan `orderBy`, Firestore mungkin meminta composite index.

## Checklist Verifikasi

Sebelum commit atau demo:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

Ketiganya harus sukses.

## Status Terakhir

Project saat ini:

- sudah tanpa fitur AI
- build berhasil
- lint berhasil
- typecheck berhasil
- struktur utama lebih bersih
- folder eksternal tidak relevan sudah dibersihkan
