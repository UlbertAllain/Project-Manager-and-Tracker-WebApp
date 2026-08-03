import { CalendarRange, CircleDollarSign, Goal, Layers3, UsersRound } from "lucide-react";
import { createProjectAction, updateProjectAction } from "@/features/projects/actions";
import { PROJECT_PRIORITIES, PROJECT_STATUSES, PROJECT_STATUS_LABELS, type Project } from "@/features/projects/types";
import type { UserProfile } from "@/features/users/types";

export function ProjectForm({ project, users }: { project?: Project; users: UserProfile[] }) {
  const activeUsers = users.filter((user) => user.isActive);
  const managers = activeUsers.filter((user) => user.role === "ADMIN" || user.role === "PROJECT_MANAGER");

  return (
    <form action={project ? updateProjectAction : createProjectAction} className="project-form-shell">
      {project ? <input type="hidden" name="projectId" value={project.id} /> : null}
      {project?.lead && !project.leadId ? <input type="hidden" name="lead" value={project.lead} /> : null}

      <section className="form-section">
        <div className="form-section-title"><Goal className="size-4" /><div><h3>Identitas project</h3><p>Jelaskan project dan hasil yang ingin dicapai.</p></div></div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nama project" name="name" defaultValue={project?.name} placeholder="Contoh: Website Company Profile" required />
          <Field label="Nama client / unit" name="clientName" defaultValue={project?.clientName} placeholder="Contoh: PT Maju Jaya" required />
          <div className="md:col-span-2"><Field label="Tujuan utama" name="objective" defaultValue={project?.objective} placeholder="Hasil bisnis yang harus tercapai dari project ini" /></div>
          <div className="md:col-span-2"><TextArea label="Deskripsi dan ruang lingkup" name="description" defaultValue={project?.description} placeholder="Tuliskan kebutuhan, output, batasan, dan konteks penting project." /></div>
        </div>
      </section>

      <section className="form-section">
        <div className="form-section-title"><UsersRound className="size-4" /><div><h3>Penanggung jawab dan tim</h3><p>Client tidak login. Semua pilihan di bawah adalah pengguna internal.</p></div></div>
        <div className="grid gap-4 md:grid-cols-2">
          <SelectUser label="Project manager" name="leadId" users={managers} defaultValue={project?.leadId} required />
          <div>
            <label className="label" htmlFor="teamMemberIds">Anggota project</label>
            <select className="input min-h-36" id="teamMemberIds" name="teamMemberIds" multiple defaultValue={project?.teamMemberIds ?? []}>
              {activeUsers.map((user) => <option key={user.uid} value={user.uid}>{user.name} — {user.jobTitle || user.role.replaceAll("_", " ")}</option>)}
            </select>
            <p className="field-hint">Tahan Ctrl/Cmd untuk memilih beberapa anggota.</p>
          </div>
        </div>
      </section>

      <section className="form-section">
        <div className="form-section-title"><CalendarRange className="size-4" /><div><h3>Jadwal dan kendali</h3><p>Tentukan fase, urgensi, dan target waktu project.</p></div></div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <SelectField label="Status" name="status" values={PROJECT_STATUSES} labels={PROJECT_STATUS_LABELS} defaultValue={project?.status ?? "BACKLOG"} />
          <SelectField label="Prioritas" name="priority" values={PROJECT_PRIORITIES} defaultValue={project?.priority ?? "MEDIUM"} />
          <Field label="Tanggal mulai" name="startDate" type="date" defaultValue={project?.startDate} required />
          <Field label="Deadline" name="deadline" type="date" defaultValue={project?.deadline} required />
        </div>
      </section>

      <section className="form-section">
        <div className="form-section-title"><Layers3 className="size-4" /><div><h3>Klasifikasi dan kebutuhan</h3><p>Gunakan data ini untuk pencarian dan evaluasi portfolio.</p></div></div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Kategori" name="category" defaultValue={project?.category} placeholder="Website, Sistem Internal, Marketing..." required />
          <Field label="Tech stack / tools" name="techStack" defaultValue={project?.techStack.join(", ")} placeholder="Next.js, Firebase, Figma" />
        </div>
      </section>

      <section className="form-section">
        <div className="form-section-title"><CircleDollarSign className="size-4" /><div><h3>Anggaran dan catatan</h3><p>Informasi sensitif ini hanya terlihat sesuai hak akses internal.</p></div></div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Budget project" name="budget" type="number" min="0" defaultValue={project?.budget ?? 0} required />
          <Field label="Progress awal (%)" name="progress" type="number" min="0" max="100" defaultValue={project?.progress ?? 0} required />
          <div className="md:col-span-2"><TextArea label="Catatan internal" name="notes" defaultValue={project?.notes} placeholder="Risiko, kesepakatan internal, atau informasi yang tidak boleh diberikan ke client." /></div>
        </div>
      </section>

      <div className="form-actions">
        <button className="btn btn-primary btn-lg" type="submit">{project ? "Simpan perubahan" : "Buat project"}</button>
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
  return <div><label className="label" htmlFor={props.name}>{label}</label><select className="input" id={props.name} {...props}><option value="">Pilih project manager</option>{users.map((user) => <option key={user.uid} value={user.uid}>{user.name} — {user.jobTitle || user.role.replaceAll("_", " ")}</option>)}</select></div>;
}

function SelectField<T extends string>({ label, values, labels, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; values: readonly T[]; labels?: Record<T, string> }) {
  return <div><label className="label" htmlFor={props.name}>{label}</label><select className="input" id={props.name} {...props}>{values.map((value) => <option key={value} value={value}>{labels?.[value] ?? value.replaceAll("_", " ")}</option>)}</select></div>;
}
