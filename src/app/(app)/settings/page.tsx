import { BriefcaseBusiness, Building2, Settings, ShieldCheck, UserRound } from "lucide-react";
import { USER_ROLE_LABELS } from "@/features/users/types";
import { requireUser } from "@/lib/auth/guards";
import { getUserProfile } from "@/lib/repositories/users";

export default async function SettingsPage() {
  const user = await requireUser();
  const profile = await getUserProfile(user.uid);

  return (
    <section className="space-y-5">
      <header className="page-heading">
        <div>
          <span className="eyebrow"><Settings className="size-3.5" /> AKUN</span>
          <h2>Pengaturan</h2>
          <p>Lihat informasi profil, peran, dan cakupan akses akun Anda.</p>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1fr_.85fr]">
        <section className="panel-card p-6">
          <div className="flex items-center gap-4">
            <div className="avatar avatar-xl">{user.name.slice(0, 2).toUpperCase()}</div>
            <div>
              <h3 className="text-lg font-bold">{user.name}</h3>
              <p className="mt-1 text-sm text-[var(--text-muted)]">{profile?.jobTitle || USER_ROLE_LABELS[user.role]}</p>
            </div>
          </div>
          <dl className="settings-grid">
            <Item icon={<UserRound />} label="Nama" value={user.name} />
            <Item icon={<ShieldCheck />} label="Peran" value={USER_ROLE_LABELS[user.role]} />
            <Item icon={<BriefcaseBusiness />} label="Jabatan" value={profile?.jobTitle || "Belum diatur"} />
            <Item icon={<Building2 />} label="Departemen" value={profile?.department || "Belum diatur"} />
            <Item icon={<UserRound />} label="Email kerja" value={user.email} />
            <Item icon={<ShieldCheck />} label="Status akun" value={profile?.isActive === false ? "Nonaktif" : "Aktif"} />
          </dl>
        </section>

        <section className="security-card">
          <div className="security-icon"><ShieldCheck className="size-6" /></div>
          <div className="security-content">
            <span className="eyebrow">AKSES DAN WEWENANG</span>
            <h3>Hak akses mengikuti tanggung jawab Anda.</h3>
            <p>Setiap pengguna hanya dapat melihat dan mengelola informasi sesuai peran serta proyek yang diberikan.</p>
            <ul>
              <li>Akses proyek mengikuti penugasan dan peran Anda.</li>
              <li>Perubahan penting tercatat dalam riwayat aktivitas.</li>
              <li>Data keuangan hanya tersedia bagi Pemilik / Admin.</li>
              <li>Hubungi administrator untuk memperbarui profil atau akses akun.</li>
            </ul>
          </div>
        </section>
      </div>
    </section>
  );
}

function Item({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div><span className="settings-icon">{icon}</span><dt>{label}</dt><dd>{value}</dd></div>;
}
