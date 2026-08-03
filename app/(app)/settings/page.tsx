import { Fingerprint, LockKeyhole, Settings, ShieldCheck, UserRound } from "lucide-react";
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
          <span className="eyebrow"><Settings className="size-3.5" /> Akun & keamanan</span>
          <h2>Pengaturan</h2>
          <p>Informasi akun internal dan ringkasan perlindungan sesi pengguna.</p>
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
            <Item icon={<ShieldCheck />} label="Role" value={USER_ROLE_LABELS[user.role]} />
            <Item icon={<Fingerprint />} label="Email" value={user.email} />
            <Item icon={<Fingerprint />} label="User ID" value={user.uid} />
            <Item icon={<UserRound />} label="Departemen" value={profile?.department || "Belum diatur"} />
            <Item icon={<UserRound />} label="Status" value={profile?.isActive === false ? "Nonaktif" : "Aktif"} />
          </dl>
        </section>

        <section className="security-card">
          <div className="security-icon"><LockKeyhole className="size-6" /></div>
          <div className="security-content">
            <span className="eyebrow">Sesi aman</span>
            <h3>Identitas pengguna selalu diperiksa oleh server.</h3>
            <p>Login diverifikasi melalui Firebase Authentication. Browser menerima cookie sesi HttpOnly, sedangkan role dan izin diperiksa kembali saat data dibaca atau diubah.</p>
            <ul>
              <li>Session cookie HttpOnly</li>
              <li>Role dari Firebase custom claims</li>
              <li>Akses proyek diperiksa di server</li>
              <li>Keuangan hanya dapat diakses admin</li>
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
