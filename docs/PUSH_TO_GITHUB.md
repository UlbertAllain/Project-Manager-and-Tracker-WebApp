# Cara Push ke GitHub dengan Aman

Jangan langsung menimpa `main`. Simpan versi lama sebagai branch backup dan kirim refactor melalui Pull Request.

## 1. Clone repository lama

```bash
git clone https://github.com/UlbertAllain/Project-Manager-and-Tracker-WebApp.git
cd Project-Manager-and-Tracker-WebApp
git switch main
git pull origin main
```

## 2. Buat backup versi lama

```bash
git branch backup/v1-before-refactor
git push -u origin backup/v1-before-refactor
```

## 3. Buat branch refactor

```bash
git switch -c refactor/v2-secure-architecture
git rm -r .
```

Perintah terakhir hanya menghapus file yang dilacak Git pada branch refactor; folder `.git` tetap ada.

## 4. Salin isi ZIP v2

Ekstrak ZIP final, lalu salin **isi folder** `nexty-project-tracker-v2` ke folder clone repository. Jangan menyalin folder pembungkusnya sebagai subfolder.

Setelah itu:

```bash
npm install
npm run check
git status
```

Periksa bahwa `.env.local` dan service account tidak muncul pada `git status`.

## 5. Commit dan push branch

```bash
git add -A
git commit -m "refactor: rebuild tracker with secure architecture"
git push -u origin refactor/v2-secure-architecture
```

Di GitHub, buat Pull Request dari `refactor/v2-secure-architecture` ke `main`. Merge hanya setelah build lulus dan alur login, project, task, board, finance, role admin, serta export CSV diuji pada Firebase staging.

## 6. Rollback

Versi lama tetap tersedia pada branch:

```bash
git switch backup/v1-before-refactor
```

## Jangan pernah dipush

- `.env.local`
- JSON service account
- password admin
- `node_modules/`
- `.next/`
