# Push v3 ke GitHub

## Branch aman

```bash
git switch main
git pull origin main
git branch backup/v2.1-before-internal-v3
git push -u origin backup/v2.1-before-internal-v3
git switch -c refactor/internal-project-management-v3
```

Timpa source dengan patch atau full project, lalu:

```bash
npm run check
git status
git add -A
git commit -m "refactor: rebuild as internal project management system"
git push -u origin refactor/internal-project-management-v3
```

Buat Pull Request:

```text
refactor/internal-project-management-v3 → main
```

## Jangan commit

- `.env.local`
- Service account JSON
- `.next`
- `node_modules`
- File backup database

## Setelah merge

Tambahkan environment variable yang sama ke deployment, deploy, jalankan migrasi data satu kali dari environment aman, lalu minta seluruh user login kembali.
