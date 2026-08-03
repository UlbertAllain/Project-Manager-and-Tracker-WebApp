# Product Scope v3

## Positioning

Nexty Workspace adalah **Internal Project Management System**, bukan client project tracker.

Tujuan utama:

1. Memastikan setiap project memiliki penanggung jawab, tim, target, dan deadline yang jelas.
2. Membuat anggota tim memperbarui pekerjaannya sendiri.
3. Mengurangi ketergantungan pada WhatsApp sebagai sumber laporan project.
4. Menyimpan hasil kerja, revisi, keputusan, dan kendala dalam konteks project/task.
5. Memberikan data evaluasi kepada PM dan owner.

## Batas internal

Client tidak memiliki akun dan tidak dapat:

- Login ke workspace.
- Melihat board internal.
- Melihat task tim.
- Memberikan komentar langsung.
- Melihat finance.
- Mengubah status project.

Komunikasi resmi tetap:

```text
Client ↔ Project Manager ↔ Tim internal
```

## Modul

### Overview

Ringkasan berdasarkan role. Member melihat pekerjaan, sedangkan PM/admin melihat risiko portfolio.

### My Work

Workspace harian untuk task pengguna. Ini menjadi halaman utama team member.

### Projects

Portfolio project yang dapat diakses sesuai assignment.

### Project Board

Visualisasi fase project. Hanya admin dan PM terkait yang dapat memindahkan project.

### Project Detail

Pusat operasional project: task, laporan, attachment, activity, target, anggota, dan catatan internal.

### Reports

Evaluasi portfolio dan distribusi pekerjaan. Data bukan digunakan sebagai ranking individu tanpa konteks.

### Team

Directory internal. Admin dapat membuat akun dan mengubah role/status.

### Finance

Data sensitif khusus admin/owner.

## Prinsip evaluasi

Health score adalah indikator awal, bukan keputusan otomatis. PM tetap perlu memahami:

- Perubahan scope.
- Ketergantungan kepada client/vendor.
- Kualitas output.
- Kompleksitas task.
- Kapasitas anggota.

Karena itu laporan menampilkan completion, overdue, dan blocked tanpa memberi label performa buruk kepada seseorang secara otomatis.
