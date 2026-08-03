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
            <span className="eyebrow">Internal project management</span>
            <h1>Seluruh pekerjaan proyek, dalam satu ruang yang jelas.</h1>
            <p>
              Atur pembagian kerja, pantau progres, dokumentasikan review, dan evaluasi
              pelaksanaan proyek tanpa membuat informasi tercecer di banyak tempat.
            </p>

            <div className="login-benefits">
              <article className="login-benefit">
                <FolderKanban className="size-5" />
                <strong>Kontrol proyek</strong>
                <span>Status, deadline, dan kondisi proyek mudah dipantau.</span>
              </article>
              <article className="login-benefit">
                <ListChecks className="size-5" />
                <strong>Pembagian kerja</strong>
                <span>Setiap anggota mengetahui tugas dan tanggung jawabnya.</span>
              </article>
              <article className="login-benefit">
                <MessageSquareText className="size-5" />
                <strong>Pelaporan terpusat</strong>
                <span>Komentar, revisi, dan attachment tersimpan bersama konteksnya.</span>
              </article>
            </div>

            <p className="login-note">Workspace privat untuk operasional tim internal perusahaan.</p>
          </div>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <div className="login-card-header">
            <span className="login-card-badge"><ShieldCheck className="size-3.5" /> Akses internal</span>
            <h2>Masuk ke workspace</h2>
            <p>Gunakan akun kerja yang telah dibuat oleh administrator perusahaan.</p>
          </div>
          <LoginForm />
          <div className="login-security">
            <ShieldCheck className="size-4" />
            <span>Sesi login diverifikasi oleh server dan tidak disimpan permanen di browser.</span>
          </div>
        </div>
      </section>
    </main>
  );
}
