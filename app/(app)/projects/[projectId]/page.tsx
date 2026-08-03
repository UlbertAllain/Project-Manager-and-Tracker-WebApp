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
import { PROJECT_STATUSES, PROJECT_STATUS_LABELS } from "@/features/projects/types";
import { canManageProject, requireUser } from "@/lib/auth/guards";
import { formatCurrency, formatDate, formatDateTime, isOverdue } from "@/lib/format";
import { projectHealth, taskSummary } from "@/lib/project-insights";
import { getProject, listActivities, listAttachments, listComments, listTasks } from "@/lib/repositories/projects";
import { listUsers } from "@/lib/repositories/users";

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
          <div className="flex flex-wrap items-center gap-2"><span className={`health-badge ${health.tone}`}>{health.label}</span><span className="badge">{PROJECT_STATUS_LABELS[project.status]}</span><span className={`priority-chip priority-${project.priority.toLowerCase()}`}>{project.priority}</span><span className="text-xs text-[var(--text-subtle)]">{project.category}</span></div>
          <h2>{project.name}</h2><p className="project-client">{project.clientName}</p>
          <p className="project-purpose">{project.objective || project.description || "Tujuan project belum dituliskan."}</p>
          <div className="team-inline"><span><UserRound className="size-3.5" /> PM: {project.lead}</span><span><UsersRound className="size-3.5" /> {project.teamMemberNames.length} anggota</span><span><CalendarDays className="size-3.5" /> {formatDate(project.startDate)} – {formatDate(project.deadline)}</span></div>
        </div>
        {canManage ? <div className="flex flex-wrap gap-2"><Link className="btn btn-secondary" href={`/projects/${project.id}/edit`}><Pencil className="size-4" /> Edit</Link>{user.role === "ADMIN" ? <form action={deleteProjectAction}><input type="hidden" name="projectId" value={project.id} /><ConfirmSubmitButton className="btn btn-danger" message="Hapus project beserta task, komentar, attachment, aktivitas, dan transaksi?"><Trash2 className="size-4" /> Hapus</ConfirmSubmitButton></form> : null}</div> : null}
      </div>

      <div className="project-metric-grid">
        <Metric label="Progress" value={`${project.progress}%`} icon={<Activity />} hint={`${summary.done} dari ${summary.total} task selesai`} />
        <Metric label="Deadline" value={formatDate(project.deadline)} icon={<Clock3 />} hint={isOverdue(project.deadline, project.status) ? "Project melewati deadline" : `${summary.overdue} task overdue`} danger={isOverdue(project.deadline, project.status)} />
        <Metric label="Review / revisi" value={String(summary.review + summary.revision)} icon={<ShieldAlert />} hint={`${summary.blocked} task terhambat`} />
        {user.role === "ADMIN" ? <Metric label="Margin tercatat" value={formatCurrency(margin)} icon={<CircleDollarSign />} hint={`${formatCurrency(project.paidAmount)} pembayaran masuk`} /> : <Metric label="Tim project" value={String(project.teamMemberNames.length + 1)} icon={<UsersRound />} hint={project.teamMemberNames.slice(0, 2).join(", ") || "Belum ada anggota"} />}
      </div>

      {canManage ? (
        <section className="status-control-card">
          <div><span className="eyebrow">PROJECT CONTROL</span><h3>Ubah fase project</h3><p>Perubahan ini tercatat pada activity log.</p></div>
          <form action={updateProjectStatusAction} className="flex flex-wrap items-center gap-2"><input type="hidden" name="projectId" value={project.id} /><select className="input min-w-44" name="status" defaultValue={project.status}>{PROJECT_STATUSES.map((status) => <option key={status} value={status}>{PROJECT_STATUS_LABELS[status]}</option>)}</select><button className="btn btn-primary" type="submit">Simpan status</button></form>
        </section>
      ) : null}

      <TaskList projectId={project.id} tasks={tasks} users={users} canManage={canManage} currentUserId={user.uid} />

      <div className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
        <CommentSection projectId={project.id} comments={comments} tasks={tasks} user={user} />
        <section className="panel-card overflow-hidden">
          <div className="section-header"><div><span className="eyebrow">AUDIT TRAIL</span><h3>Aktivitas terbaru</h3><p>Riwayat perubahan penting di project.</p></div></div>
          <div className="activity-list">
            {activities.map((item) => <article className="activity-row" key={item.id}><span className="activity-dot" /><div><p>{item.message}</p><span>{formatDateTime(item.createdAt)}</span></div></article>)}
            {activities.length === 0 ? <div className="empty-state">Belum ada aktivitas tercatat.</div> : null}
          </div>
        </section>
      </div>

      <AttachmentSection projectId={project.id} attachments={attachments} tasks={tasks} user={user} />

      {(project.description || project.notes || project.techStack.length > 0) ? (
        <section className="panel-card project-context-grid">
          <div><span className="eyebrow">RUANG LINGKUP</span><h3>Deskripsi project</h3><p>{project.description || "Belum ada deskripsi."}</p></div>
          <div><span className="eyebrow">CATATAN INTERNAL</span><h3>Informasi tim</h3><p>{project.notes || "Belum ada catatan internal."}</p></div>
          <div><span className="eyebrow">TOOLS & STACK</span><h3>Teknologi</h3><div className="mt-3 flex flex-wrap gap-2">{project.techStack.map((item) => <span className="badge" key={item}>{item}</span>)}{project.techStack.length === 0 ? <span className="text-xs text-[var(--text-subtle)]">Belum ditentukan.</span> : null}</div></div>
        </section>
      ) : null}
    </section>
  );
}

function Metric({ label, value, icon, hint, danger = false }: { label: string; value: string; icon: React.ReactNode; hint: string; danger?: boolean }) {
  return <div className={`project-metric-card ${danger ? "danger" : ""}`}><div className="project-metric-icon">{icon}</div><div><span>{label}</span><strong>{value}</strong><p>{hint}</p></div></div>;
}
