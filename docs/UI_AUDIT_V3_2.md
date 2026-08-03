# Audit UI v3.2

## Masalah utama versi 3.1

1. **Dua sistem desain bertabrakan.** CSS dark versi lama masih menjadi dasar, lalu light theme ditempel sebagai override `.clean-workspace`. Halaman login berada di luar wrapper tersebut sehingga tetap mengambil card, input, dan warna dark.
2. **Kontras login gagal.** Heading dan brand memakai warna teks gelap di atas panel biru gelap; card login juga gelap tetapi label dan deskripsinya memakai warna gelap.
3. **Skala tipografi tidak proporsional.** Heading login sampai 72px sehingga lebih menyerupai landing page promosi daripada layar autentikasi aplikasi internal.
4. **Ukuran teks operasional terlalu kecil.** Banyak label tabel, badge, dan metadata berada pada 8–10px sehingga sulit dipindai saat dipakai lama.
5. **Layout dibuat dengan patch spesifik, bukan sistem.** Komponen dasar memakai gradient/glass lama lalu ditimpa per halaman. Hasilnya sidebar, dashboard, form, board, detail proyek, dan pengaturan tidak konsisten.
6. **Navigasi mobile tidak layak.** Sidebar berubah menjadi bar horizontal yang dapat digeser, bukan drawer yang jelas.
7. **Halaman pengaturan rusak secara struktur.** `security-card` memakai layout flex untuk seluruh child sehingga heading, paragraf, dan daftar berpotensi tersusun satu baris.
8. **Bahasa UI tidak konsisten.** Menu dan judul bercampur antara Inggris dan Indonesia tanpa alasan produk yang jelas.

## Keputusan redesign

- Menghapus fondasi dark dan seluruh override bertumpuk.
- Menggunakan satu sistem token untuk warna, spacing, radius, shadow, dan typography.
- Light workspace dengan permukaan putih, border netral, dan aksen biru tunggal.
- Ukuran teks minimum operasional dinaikkan agar nyaman dibaca.
- Login dibuat tenang dan fokus, tanpa headline raksasa atau card gelap.
- Sidebar desktop dibuat sederhana dan sidebar mobile menjadi drawer.
- Dashboard mempertahankan struktur mockup yang disetujui.
- Project, task board, form, comments, attachments, team, reports, finance, dan settings memakai komponen visual yang sama.
- Tidak menambah dependency dan tidak mengubah data maupun permission.
