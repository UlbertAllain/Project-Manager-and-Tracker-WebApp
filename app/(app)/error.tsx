"use client";

import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function WorkspaceError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="panel-card mx-auto max-w-2xl p-8 text-center">
      <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-amber-50 text-amber-600">
        <AlertTriangle className="size-6" />
      </div>
      <h2 className="text-xl font-bold text-[var(--text-main)]">Halaman belum dapat ditampilkan</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[var(--text-muted)]">
        Terjadi kendala saat memuat data. Coba muat ulang halaman atau kembali ke Ringkasan.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button className="btn btn-primary" onClick={reset} type="button">
          <RefreshCw className="size-4" /> Coba Lagi
        </button>
        <Link className="btn btn-secondary" href="/dashboard">Kembali ke Ringkasan</Link>
      </div>
    </section>
  );
}
