import Link from "next/link";
import { FileQuestion } from "lucide-react";

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--app-bg)] p-6">
      <section className="panel-card w-full max-w-xl p-8 text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-blue-50 text-[var(--brand)]">
          <FileQuestion className="size-6" />
        </div>
        <p className="eyebrow">HALAMAN TIDAK DITEMUKAN</p>
        <h1 className="mt-2 text-2xl font-bold text-[var(--text-main)]">Halaman yang Anda cari tidak tersedia</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[var(--text-muted)]">
          Tautan mungkin sudah berubah, data telah dihapus, atau Anda tidak memiliki akses ke halaman tersebut.
        </p>
        <Link className="btn btn-primary mt-6" href="/dashboard">Kembali ke Ringkasan</Link>
      </section>
    </main>
  );
}
