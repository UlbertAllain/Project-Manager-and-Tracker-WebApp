# Verification v3.1

Pemeriksaan packaging:

- seluruh file TypeScript dan TSX diperiksa dengan TypeScript transpile diagnostics;
- seluruh import internal `@/` diperiksa keberadaan targetnya;
- seluruh JSON diperiksa valid;
- jumlah kurung CSS diperiksa seimbang;
- script Node diperiksa dengan `node --check`;
- ZIP diperiksa integritasnya;
- `.env.local`, `.next`, `node_modules`, dan `.git` tidak disertakan;
- tidak ada dependency baru.

Build penuh tidak dapat dijalankan di lingkungan packaging karena registry npm internal tidak menyediakan `@types/node`, sedangkan akses langsung ke registry publik mengalami timeout. Jalankan `npm run check` di komputer pengembangan setelah patch dipasang.
