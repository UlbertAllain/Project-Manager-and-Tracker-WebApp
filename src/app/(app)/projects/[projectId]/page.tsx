import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Activity,
  CalendarDays,
  CircleDollarSign,
  Clock3,
  Pencil,
  ShieldAlert,
  Trash2,
  UserRound,
  UsersRound,
} from "lucide-react";
import { ConfirmSubmitButton } from "@/components/ui/ConfirmSubmitButton";
import { AttachmentSection } from "@/features/projects/AttachmentSection";
import { CommentSection } from "@/features/projects/CommentSection";
import { TaskList } from "@/features/projects/TaskList";
import { deleteProjectAction, updateProjectStatusAction } from "@/features/projects/actions";
import { PRIORITY_LABELS, PROJECT_STATUSES, PROJECT_STATUS_LABELS } from "@/features/projects/types";
import { canManageProject, requireUser } from "@/lib/auth/guards";
import { formatCurrency, formatDate, formatDateTime, isOverdue } from "@/lib/format";
import { projectHealth, taskSummary } from "@/lib/project-insights";
import { getProject, listActivities, listAttachments, listComments, listTasks } from "@/lib/repositories/projects";
import { listUsers } from "@/lib/repositories/users";
import { formatActivityMessage } from "@/lib/ui-copy";

export default async function ProjectDetailPage({ params }: { params: Promise<{ projectId: string }> }) {
  const user = await requireUser();
  const { projectId } = await params;
  const project = await getProject(projectId, user);
  if (!project) notFound();

  const [tasks, comments, attachments, activities, users] = await Promise.all([
    listTasks(projectId, project.name),
    listComments(projectId),
    listAttachments(projectId),
    listActivities(projectId),
    listUsers(),
  ]);
  const canManage = canManageProject(user, project);
  const health = projectHealth(project, tasks);
  const summary = taskSummary(tasks);
  const margin = project.paidAmount - project.totalExpense;

  return (
    <section className="space-y-5">
      <div className="project-detail-hero">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2"><span className={`health-badge ${health.tone}`}>{health.label}</span><span className="badge">{PROJECT_STATUS_LABELS[project.status]}</span><span className={`priority-chip priority-${project.priority.toLowerCase()}`}>{PRIORITY_LABELS[project.priority]}</span><span className="text-xs text-[var(--text-subtle)]">{project.category}</span></div>
          <h2>{project.name}</h2><p className="project-client">{project.clientName}</p>
          <p className="project-purpose">{project.objective || project.description || "Tujuan proyek belum ditambahkan."}</p>
          <div className="team-inline"><span><UserRound className="size-3.5" /> Manajer Proyek: {project.lead}</span><span><UsersRound className="size-3.5" /> {project.teamMemberNames.length} anggota</span><span><CalendarDays className="size-3.5" /> {formatDate(project.startDate)} – {formatDate(project.deadline)}</span></div>
        </div>
        {canManage ? <div className="flex flex-wrap gap-2"><Link className="btn btn-secondary" href={`/projects/${project.id}/edit`}><Pencil className="size-4" /> Edit Proyek</Link>{user.role === "ADMIN" ? <form action={deleteProjectAction}><input type="hidden" name="projectId" value={project.id} /><ConfirmSubmitButton className="btn btn-danger" message="Hapus proyek ini? Seluruh tugas, laporan, lampiran, aktivitas, dan transaksi terkait akan ikut dihapus. Tindakan ini tidak dapat dibatalkan."><Trash2 className="size-4" /> Hapus Proyek</ConfirmSubmitButton></form> : null}</div> : null}
      </div>

      <div className="project-metric-grid">
        <Metric label="Progres" value={`${project.progress}%`} icon={<Activity />} hint={`${summary.done} dari ${summary.total} tugas selesai`} />
        <Metric label="Batas Waktu" value={formatDate(project.deadline)} icon={<Clock3 />} hint={isOverdue(project.deadline, project.status) ? "Proyek telah melewati batas waktu" : `${summary.overdue} tugas terlambat`} danger={isOverdue(project.deadline, project.status)} />
        <Metric label="Tinjauan / Revisi" value={String(summary.review + summary.revision)} icon={<ShieldAlert />} hint={`${summary.blocked} tugas terhambat`} />
        {user.role === "ADMIN" ? <Metric label="Margin tercatat" value={formatCurrency(margin)} icon={<CircleDollarSign />} hint={`${formatCurrency(project.paidAmount)} pembayaran masuk`} /> : <Metric label="Tim Proyek" value={String(project.teamMemberNames.length + 1)} icon={<UsersRound />} hint={project.teamMemberNames.slice(0, 2).join(", ") || "Belum ada anggota"} />}
      </div>

      {canManage ? (
        <section className="status-control-card">
          <div><span className="eyebrow">KENDALI PROYEK</span><h3>Ubah Tahap Proyek</h3><p>Setiap perubahan tahap akan tercatat dalam riwayat aktivitas.</p></div>
          <form action={updateProjectStatusAction} className="flex flex-wrap items-center gap-2"><input type="hidden" name="projectId" value={project.id} /><select className="input min-w-44" name="status" defaultValue={project.status}>{PROJECT_STATUSES.map((status) => <option key={status} value={status}>{PROJECT_STATUS_LABELS[status]}</option>)}</select><button className="btn btn-primary" type="submit">Simpan Tahap</button></form>
        </section>
      ) : null}

      <TaskList projectId={project.id} tasks={tasks} users={users} canManage={canManage} currentUserId={user.uid} />

      <div className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
        <CommentSection projectId={project.id} comments={comments} tasks={tasks} user={user} />
        <section className="panel-card overflow-hidden">
          <div className="section-header"><div><span className="eyebrow">RIWAYAT AKTIVITAS</span><h3>Aktivitas Terbaru</h3><p>Lihat perubahan penting yang terjadi pada proyek ini.</p></div></div>
          <div className="activity-list">
            {activities.map((item) => <article className="activity-row" key={item.id}><span className="activity-dot" /><div><p>{formatActivityMessage(item.message)}</p><span>{formatDateTime(item.createdAt)}</span></div></article>)}
            {activities.length === 0 ? <div className="empty-state">Belum ada aktivitas. Perubahan penting pada proyek akan muncul di sini.</div> : null}
          </div>
        </section>
      </div>

      <AttachmentSection projectId={project.id} attachments={attachments} tasks={tasks} user={user} />

      {(project.description || project.notes || project.techStack.length > 0) ? (
        <section className="panel-card project-context-grid">
          <div><span className="eyebrow">RUANG LINGKUP</span><h3>Deskripsi Proyek</h3><p>{project.description || "Belum ada deskripsi proyek."}</p></div>
          <div><span className="eyebrow">CATATAN INTERNAL</span><h3>Informasi tim</h3><p>{project.notes || "Belum ada catatan internal."}</p></div>
          <div><span className="eyebrow">TEKNOLOGI & ALAT</span><h3>Perangkat Kerja</h3><div className="mt-3 flex flex-wrap gap-2">{project.techStack.map((item) => <span className="badge" key={item}>{item}</span>)}{project.techStack.length === 0 ? <span className="text-xs text-[var(--text-subtle)]">Belum ditentukan.</span> : null}</div></div>
        </section>
      ) : null}
    </section>
  );
}

function Metric({ label, value, icon, hint, danger = false }: { label: string; value: string; icon: React.ReactNode; hint: string; danger?: boolean }) {
  return <div className={`project-metric-card ${danger ? "danger" : ""}`}><div className="project-metric-icon">{icon}</div><div><span>{label}</span><strong>{value}</strong><p>{hint}</p></div></div>;
}
