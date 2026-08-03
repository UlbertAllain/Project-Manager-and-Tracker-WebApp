import { BriefcaseBusiness, Mail, ShieldCheck, UserPlus, UsersRound } from "lucide-react";
import { createUserAction, updateUserAction } from "@/features/users/actions";
import { USER_ROLES, USER_ROLE_LABELS } from "@/features/users/types";
import { requireUser } from "@/lib/auth/guards";
import { listUsers } from "@/lib/repositories/users";

export default async function TeamPage() {
  const currentUser = await requireUser();
  if (currentUser.role === "MEMBER") throw new Error("Halaman tim hanya dapat diakses admin dan project manager.");
  const users = await listUsers();
  const active = users.filter((user) => user.isActive);

  return (
    <section className="space-y-5">
      <header className="page-heading"><div><span className="eyebrow"><UsersRound className="size-3.5" /> TIM INTERNAL</span><h2>Tim</h2><p>Kelola akun, jabatan, departemen, dan peran pengguna internal.</p></div></header>

      <div className="dashboard-metrics team-metrics">
        <Metric label="Anggota aktif" value={String(active.length)} icon={<UsersRound />} />
        <Metric label="Project manager" value={String(active.filter((user) => user.role === "PROJECT_MANAGER").length)} icon={<BriefcaseBusiness />} />
        <Metric label="Administrator" value={String(active.filter((user) => user.role === "ADMIN").length)} icon={<ShieldCheck />} />
      </div>

      {currentUser.role === "ADMIN" ? (
        <section className="panel-card overflow-hidden">
          <div className="section-header"><div><span className="eyebrow">PENGELOLAAN AKUN</span><h3>Tambahkan anggota internal</h3><p>Akun dibuat melalui Firebase Auth dan role disimpan sebagai custom claim.</p></div><UserPlus className="size-5 text-[var(--brand)]" /></div>
          <form action={createUserAction} className="team-create-form">
            <div><label className="label">Nama lengkap</label><input className="input" name="name" required /></div>
            <div><label className="label">Email kerja</label><input className="input" name="email" type="email" required /></div>
            <div><label className="label">Password awal</label><input className="input" name="password" type="password" minLength={8} required /></div>
            <div><label className="label">Role</label><select className="input" name="role" defaultValue="MEMBER">{USER_ROLES.map((role) => <option key={role} value={role}>{USER_ROLE_LABELS[role]}</option>)}</select></div>
            <div><label className="label">Jabatan</label><input className="input" name="jobTitle" placeholder="Frontend Developer" /></div>
            <div><label className="label">Departemen</label><input className="input" name="department" placeholder="Engineering" /></div>
            <div className="flex items-end"><button className="btn btn-primary w-full" type="submit"><UserPlus className="size-4" /> Buat akun</button></div>
          </form>
        </section>
      ) : null}

      <section className="team-grid">
        {users.map((user) => (
          <article className={`team-card ${!user.isActive ? "inactive" : ""}`} key={user.uid}>
            <div className="team-card-head"><div className="avatar avatar-xl">{user.name.slice(0, 2).toUpperCase()}</div><span className={`health-badge ${user.isActive ? "success" : "muted"}`}>{user.isActive ? "Aktif" : "Nonaktif"}</span></div>
            <h3>{user.name}</h3><p className="role-name">{USER_ROLE_LABELS[user.role]}</p>
            <div className="team-details"><span><BriefcaseBusiness className="size-3.5" /> {user.jobTitle || "Jabatan belum diisi"}</span><span><UsersRound className="size-3.5" /> {user.department || "Departemen belum diisi"}</span><span><Mail className="size-3.5" /> {user.email}</span></div>
            {currentUser.role === "ADMIN" ? (
              <details className="team-edit"><summary>Edit anggota</summary><form action={updateUserAction} className="mt-3 grid gap-3"><input type="hidden" name="uid" value={user.uid} /><input className="input" name="name" defaultValue={user.name} required /><select className="input" name="role" defaultValue={user.role}>{USER_ROLES.map((role) => <option key={role} value={role}>{USER_ROLE_LABELS[role]}</option>)}</select><input className="input" name="jobTitle" defaultValue={user.jobTitle} placeholder="Jabatan" /><input className="input" name="department" defaultValue={user.department} placeholder="Departemen" /><select className="input" name="isActive" defaultValue={String(user.isActive)}><option value="true">Aktif</option><option value="false">Nonaktif</option></select><button className="btn btn-secondary" type="submit">Simpan anggota</button></form></details>
            ) : null}
          </article>
        ))}
      </section>
    </section>
  );
}

function Metric({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return <div className="dashboard-metric"><div className="dashboard-metric-icon">{icon}</div><div><p>{label}</p><strong>{value}</strong><span>Pengguna internal</span></div></div>;
}
