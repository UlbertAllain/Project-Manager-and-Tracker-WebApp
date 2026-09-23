import { FolderKanban, ListChecks, MessageSquareText, ShieldCheck } from "lucide-react";
import { LoginForm } from "@/features/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="login-shell">
      <section className="login-showcase" aria-label="Tentang Nexty Workspace">
        <div className="login-showcase-inner">
          <div className="login-brand">
            <span className="login-brand-mark">N</span>
            <span>Nexty Workspace</span>
          </div>

          <div className="login-copy">
            <span className="eyebrow">MANAJEMEN PROYEK INTERNAL</span>
            <h1>Pekerjaan tim lebih terarah, progres proyek lebih mudah dipantau.</h1>
            <p>
              Kelola pembagian tugas, pantau progres, catat hasil tinjauan, dan evaluasi
              pelaksanaan proyek tanpa membuat informasi tercecer di banyak tempat.
            </p>

            <div className="login-benefits">
              <article className="login-benefit">
                <FolderKanban className="size-5" />
                <strong>Kendali proyek</strong>
                <span>Tahap, batas waktu, dan kondisi proyek dapat dipantau dengan jelas.</span>
              </article>
              <article className="login-benefit">
                <ListChecks className="size-5" />
                <strong>Pembagian kerja</strong>
                <span>Setiap anggota mengetahui tugas, prioritas, dan tanggung jawabnya.</span>
              </article>
              <article className="login-benefit">
                <MessageSquareText className="size-5" />
                <strong>Pelaporan terpusat</strong>
                <span>Laporan, revisi, dan lampiran tersimpan bersama konteks pekerjaannya.</span>
              </article>
            </div>

            <p className="login-note">Khusus untuk anggota internal perusahaan yang telah terdaftar.</p>
          </div>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <div className="login-card-header">
            <span className="login-card-badge"><ShieldCheck className="size-3.5" /> Akses tim</span>
            <h2>Masuk ke Nexty Workspace</h2>
            <p>Gunakan email dan kata sandi yang diberikan oleh administrator perusahaan.</p>
          </div>
          <LoginForm />
          <div className="login-security">
            <ShieldCheck className="size-4" />
            <span>Akses hanya tersedia bagi anggota tim yang telah terdaftar.</span>
          </div>
        </div>
      </section>
    </main>
  );
}
