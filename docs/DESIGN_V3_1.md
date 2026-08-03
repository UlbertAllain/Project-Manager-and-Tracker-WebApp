# Nexty Workspace v3.1 — Clean Professional UI

## Arah desain

Antarmuka v3.1 menggunakan light workspace yang netral dan profesional:

- latar abu-abu sangat muda;
- kartu putih dengan border tipis;
- warna biru sebagai satu aksen utama;
- shadow halus tanpa efek glow;
- radius yang lebih kecil dan konsisten;
- tipografi lebih mudah dibaca;
- navigasi desktop tetap di sidebar;
- topbar berisi pencarian, nama workspace, tanggal, dan profil user.

## Dashboard

Dashboard mengambil data aktual dari Firestore dan menampilkan:

- proyek aktif;
- task menunggu review;
- task blocked;
- deadline tujuh hari ke depan;
- project health;
- prioritas kerja;
- board preview;
- activity log terbaru;
- estimasi beban kerja internal.

Beban kerja bukan penilaian performa karyawan. Nilainya adalah indikator operasional berdasarkan jumlah task aktif, status, dan prioritas. Evaluasi manusia tetap diperlukan.

## Role-aware interface

- Admin dan Project Manager mendapatkan tombol membuat project, health portfolio, serta workload tim.
- Team Member mendapatkan shortcut My Work dan ringkasan task pribadi.
- Finance tetap hanya muncul untuk Admin.
- Team dan Reports hanya muncul untuk Admin dan Project Manager.

## Search

Pencarian topbar bekerja melalui halaman `/projects?q=...` dan mencocokkan:

- nama project;
- nama client;
- project manager;
- kategori;
- tech stack.
