import { CalendarRange, CircleDollarSign, Goal, Layers3, UsersRound } from "lucide-react";
import { createProjectAction, updateProjectAction } from "@/features/projects/actions";
import { PRIORITY_LABELS, PROJECT_PRIORITIES, PROJECT_STATUSES, PROJECT_STATUS_LABELS, type Project } from "@/features/projects/types";
import { USER_ROLE_LABELS, type UserProfile } from "@/features/users/types";

export function ProjectForm({ project, users }: { project?: Project; users: UserProfile[] }) {
  const activeUsers = users.filter((user) => user.isActive);
  const managers = activeUsers.filter((user) => user.role === "ADMIN" || user.role === "PROJECT_MANAGER");

  return (
    <form action={project ? updateProjectAction : createProjectAction} className="project-form-shell">
      {project ? <input type="hidden" name="projectId" value={project.id} /> : null}
      {project?.lead && !project.leadId ? <input type="hidden" name="lead" value={project.lead} /> : null}

      <section className="form-section">
        <div className="form-section-title"><Goal className="size-4" /><div><h3>Identitas Proyek</h3><p>Jelaskan proyek dan hasil utama yang ingin dicapai.</p></div></div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nama proyek" name="name" defaultValue={project?.name} placeholder="Contoh: Website Profil Perusahaan" required />
          <Field label="Nama klien / unit" name="clientName" defaultValue={project?.clientName} placeholder="Contoh: PT Maju Jaya" required />
          <div className="md:col-span-2"><Field label="Tujuan utama" name="objective" defaultValue={project?.objective} placeholder="Tuliskan hasil utama yang harus dicapai dari proyek ini" /></div>
          <div className="md:col-span-2"><TextArea label="Deskripsi dan ruang lingkup" name="description" defaultValue={project?.description} placeholder="Jelaskan kebutuhan, hasil yang diharapkan, batasan, dan konteks penting proyek." /></div>
        </div>
      </section>

      <section className="form-section">
        <div className="form-section-title"><UsersRound className="size-4" /><div><h3>Penanggung Jawab dan Tim</h3><p>Tentukan manajer proyek dan anggota internal yang terlibat.</p></div></div>
        <div className="grid gap-4 md:grid-cols-2">
          <SelectUser label="Manajer proyek" name="leadId" users={managers} defaultValue={project?.leadId} required />
          <div>
            <label className="label" htmlFor="teamMemberIds">Anggota proyek</label>
            <select className="input min-h-36" id="teamMemberIds" name="teamMemberIds" multiple defaultValue={project?.teamMemberIds ?? []}>
              {activeUsers.map((user) => <option key={user.uid} value={user.uid}>{user.name} — {user.jobTitle || USER_ROLE_LABELS[user.role]}</option>)}
            </select>
            <p className="field-hint">Gunakan Ctrl pada Windows atau Command pada Mac untuk memilih lebih dari satu anggota.</p>
          </div>
        </div>
      </section>

      <section className="form-section">
        <div className="form-section-title"><CalendarRange className="size-4" /><div><h3>Jadwal dan Kendali</h3><p>Tentukan tahap, prioritas, dan target waktu proyek.</p></div></div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <SelectField label="Status" name="status" values={PROJECT_STATUSES} labels={PROJECT_STATUS_LABELS} defaultValue={project?.status ?? "BACKLOG"} />
          <SelectField label="Prioritas" name="priority" values={PROJECT_PRIORITIES} labels={PRIORITY_LABELS} defaultValue={project?.priority ?? "MEDIUM"} />
          <Field label="Tanggal mulai" name="startDate" type="date" defaultValue={project?.startDate} required />
          <Field label="Batas waktu" name="deadline" type="date" defaultValue={project?.deadline} required />
        </div>
      </section>

      <section className="form-section">
        <div className="form-section-title"><Layers3 className="size-4" /><div><h3>Klasifikasi dan Kebutuhan</h3><p>Informasi ini membantu pencarian dan evaluasi portofolio proyek.</p></div></div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Kategori" name="category" defaultValue={project?.category} placeholder="Contoh: Website, Sistem Internal, atau Pemasaran" required />
          <Field label="Teknologi / alat kerja" name="techStack" defaultValue={project?.techStack.join(", ")} placeholder="Contoh: Figma, GitHub, Google Drive" />
        </div>
      </section>

      <section className="form-section">
        <div className="form-section-title"><CircleDollarSign className="size-4" /><div><h3>Anggaran dan Catatan</h3><p>Informasi ini hanya dapat dilihat oleh pengguna yang memiliki wewenang.</p></div></div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Anggaran proyek" name="budget" type="number" min="0" defaultValue={project?.budget ?? 0} required />
          <Field label="Progres awal (%)" name="progress" type="number" min="0" max="100" defaultValue={project?.progress ?? 0} required />
          <div className="md:col-span-2"><TextArea label="Catatan internal" name="notes" defaultValue={project?.notes} placeholder="Tuliskan risiko, keputusan internal, atau informasi penting untuk tim." /></div>
        </div>
      </section>

      <div className="form-actions">
        <button className="btn btn-primary btn-lg" type="submit">{project ? "Simpan Perubahan" : "Buat Proyek"}</button>
      </div>
    </form>
  );
}

function Field({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return <div><label className="label" htmlFor={props.name}>{label}</label><input className="input" id={props.name} {...props} /></div>;
}

function TextArea({ label, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return <div><label className="label" htmlFor={props.name}>{label}</label><textarea className="input min-h-32 resize-y" id={props.name} {...props} /></div>;
}

function SelectUser({ label, users, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; users: UserProfile[] }) {
  return <div><label className="label" htmlFor={props.name}>{label}</label><select className="input" id={props.name} {...props}><option value="">Pilih manajer proyek</option>{users.map((user) => <option key={user.uid} value={user.uid}>{user.name} — {user.jobTitle || USER_ROLE_LABELS[user.role]}</option>)}</select></div>;
}

function SelectField<T extends string>({ label, values, labels, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; values: readonly T[]; labels?: Record<T, string> }) {
  return <div><label className="label" htmlFor={props.name}>{label}</label><select className="input" id={props.name} {...props}>{values.map((value) => <option key={value} value={value}>{labels?.[value] ?? value.replaceAll("_", " ")}</option>)}</select></div>;
}
