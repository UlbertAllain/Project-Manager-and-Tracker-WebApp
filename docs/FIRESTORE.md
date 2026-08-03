# Firestore Schema dan Query Strategy

Dokumen ini menjelaskan struktur data Firestore, strategi query, pagination, indexing, dan audit/migration data untuk Nexty Labs Project Tracker.

## Collections

### `users`

```ts
{
  email: string;
  name: string;
  password?: string;
  role: "ADMIN" | "PROJECT_LEAD" | "STAFF";
  createdAt: string;
  updatedAt: string;
}
```

Catatan:

- API user list tidak pernah mengembalikan `password`.
- Password baru disimpan sebagai hash `scrypt`.

### `projects`

```ts
{
  projectName: string;
  clientName: string;
  projectLead: string;
  description: string;
  status:
    | "NEW"
    | "IN_PROGRESS"
    | "FINISHING"
    | "REVIEW"
    | "REVISION"
    | "ON_HOLD"
    | "OVERDUE"
    | "CANCELLED"
    | "COMPLETED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  category: string;
  techStack: string; // JSON string dari string[]
  startDate: string;
  deadline: string;
  completedDate: string | null;
  budget: number;
  paidAmount: number;
  totalExpense: number;
  paymentStatus: "UNPAID" | "PARTIAL" | "PAID";
  progress: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}
```

Catatan:

- `techStack` disimpan sebagai JSON string untuk kompatibilitas data lama.
- Adapter `lib/db.ts` mengembalikan `techStack` sebagai `string[]` ke frontend.
- Project aktif otomatis menjadi `OVERDUE` saat dibaca jika `deadline` sudah lewat.

### `tasks`

```ts
{
  projectId: string;
  title: string;
  assignedTo: string;
  dueDate: string;
  isCompleted: boolean;
  order: number;
}
```

Catatan:

- `assignedTo` menyimpan email user.
- `dueDate` boleh string kosong jika task tidak punya tenggat.
- Update task memakai strategi replace seluruh task list per project, tetapi ID task dipertahankan.

### `attachments`

```ts
{
  projectId: string;
  title: string;
  url: string;
  platform: string;
}
```

### `transactions`

```ts
{
  projectId: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  description: string;
  date: string;
  createdAt: string;
}
```

Catatan:

- Setelah transaksi berubah, project menghitung ulang `paidAmount`, `totalExpense`, dan `paymentStatus`.

### `comments`

```ts
{
  projectId: string;
  userEmail: string;
  message: string;
  createdAt: string;
}
```

### `activityLogs`

```ts
{
  projectId: string;
  action: "CREATED" | "UPDATED" | "DELETED" | "STATUS_CHANGED" | "PAYMENT_CHANGED";
  message: string;
  timestamp: string;
}
```

## Query Strategy

Adapter Firestore berada di:

```text
lib/db.ts
```

Strategi saat ini:

- Query relasi child memakai `where("projectId", "==", projectId)`.
- Sorting dilakukan di memory untuk menghindari kebutuhan composite index saat development.
- API pagination dilakukan setelah data disortir di server.
- Replace task/attachment dan delete project memakai batch operation yang dipecah per 450 operasi agar tidak melewati batas Firestore batch 500 operasi.

## Pagination API

Endpoint berikut mendukung `page` dan `limit`:

- `GET /api/projects?page=1&limit=20`
- `GET /api/transactions?page=1&limit=20`
- `GET /api/logs?page=1&limit=20`
- `GET /api/logs?projectId={id}&page=1&limit=20`

Response saat pagination dipakai:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

Jika `page` dan `limit` tidak dikirim, response lama tetap:

```json
{
  "data": []
}
```

## Indexing Strategy

Karena sorting saat ini dilakukan di memory, app masih bisa berjalan tanpa composite index tambahan untuk flow utama.

Index yang disarankan jika dataset mulai besar:

### `tasks`

Query:

```text
where projectId == {projectId}
orderBy order asc
```

Index:

```text
projectId ASC, order ASC
```

### `attachments`

Query:

```text
where projectId == {projectId}
```

Index single-field default Firestore cukup.

### `transactions`

Query:

```text
where projectId == {projectId}
orderBy date desc
```

Index:

```text
projectId ASC, date DESC
```

Query:

```text
where date >= {startDate}
where date <= {endDate}
orderBy date desc
```

Index:

```text
date DESC
```

### `comments`

Query:

```text
where projectId == {projectId}
orderBy createdAt desc
```

Index:

```text
projectId ASC, createdAt DESC
```

### `activityLogs`

Query:

```text
where projectId == {projectId}
orderBy timestamp desc
```

Index:

```text
projectId ASC, timestamp DESC
```

Global feed:

```text
orderBy timestamp desc
```

Index single-field default Firestore cukup.

## Data Audit dan Migration

Script:

```bash
npm run audit:data
```

Mode ini hanya membaca data dan melaporkan dokumen yang perlu perhatian.

Untuk memperbaiki field default/format lama:

```bash
npm run migrate:data
```

Yang diperiksa:

- `projects.status`
- `projects.priority`
- `projects.paymentStatus`
- field number project: `budget`, `paidAmount`, `totalExpense`, `progress`
- normalisasi `projects.techStack`
- default `createdAt` dan `updatedAt`
- `tasks.order`
- `tasks.isCompleted`
- default `tasks.assignedTo`
- default `tasks.dueDate`

Catatan:

- Jalankan `audit:data` sebelum `migrate:data`.
- Pastikan `.env.local` atau `.env` berisi konfigurasi Firebase Admin.
- Script memakai batch chunk 450 operasi untuk menjaga batas Firestore.
