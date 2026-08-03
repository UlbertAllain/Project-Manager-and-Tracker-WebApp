import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarDays,
  Clock3,
  FolderKanban,
  MessageSquareText,
  Paperclip,
} from "lucide-react";
import {
  TASK_STATUS_LABELS,
  type ProjectActivity,
  type ProjectTask,
  type TaskStatus,
} from "@/features/projects/types";
import { USER_ROLE_LABELS } from "@/features/users/types";
import { requireUser } from "@/lib/auth/guards";
import { formatDate, isOverdue, parseDateValue } from "@/lib/format";
import { daysUntil, projectHealth, taskSummary } from "@/lib/project-insights";
import { listActivities, listProjects, listTasksForUser } from "@/lib/repositories/projects";
import { listUsers } from "@/lib/repositories/users";

const boardColumns: Array<{ status: TaskStatus; label: string }> = [
  { status: "IN_PROGRESS", label: "Dikerjakan" },
  { status: "REVIEW", label: "Review" },
  { status: "BLOCKED", label: "Blocked" },
  { status: "DONE", label: "Selesai" },
];

export default async function DashboardPage() {
  const user = await requireUser();
  const projects = await listProjects(user);
  const tasks = await listTasksForUser(user, projects);
  const activeProjects = projects.filter((project) => !["COMPLETED", "CANCELLED"].includes(project.status));
  const summary = taskSummary(tasks);
  const deadlinesThisWeek = tasks.filter((task) => {
    const remaining = daysUntil(task.dueDate);
    return task.status !== "DONE" && remaining !== null && remaining >= 0 && remaining <= 7;
  }).length;

  const activityGroups = await Promise.all(
    projects.slice(0, 8).map(async (project) => {
      const projectActivities = await listActivities(project.id, 4);
      return projectActivities.map((activity) => ({ ...activity, projectName: project.name }));
    }),
  );
  const recentActivities = activityGroups
    .flat()
    .sort((a, b) => (parseDateValue(b.createdAt)?.getTime() ?? 0) - (parseDateValue(a.createdAt)?.getTime() ?? 0))
    .slice(0, 5);

  const teamUsers = user.role === "MEMBER" ? [] : (await listUsers()).filter((item) => item.isActive);
  const workload = teamUsers
    .map((member) => {
      const assigned = tasks.filter((task) =>
        task.assigneeId === member.uid || (!task.assigneeId && task.assignee.toLowerCase() === member.name.toLowerCase()),
      );
      const score = Math.min(100, Math.round(assigned.reduce((total, task) => total + taskWeight(task), 0) * 12));
      return { ...member, score, openTasks: assigned.filter((task) => task.status !== "DONE").length };
    })
    .filter((member) => member.openTasks > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const workItems = [...tasks]
    .filter((task) => task.status !== "DONE")
    .sort((a, b) => {
      const aTime = parseDateValue(a.dueDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const bTime = parseDateValue(b.dueDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      return Number(isOverdue(b.dueDate, b.status)) - Number(isOverdue(a.dueDate, a.status)) || aTime - bTime;
    })
    .slice(0, 5);

  const healthRows = activeProjects
    .map((project) => {
      const projectTasks = tasks.filter((task) => task.projectId === project.id);
      return { project, health: projectHealth(project, projectTasks) };
    })
    .sort((a, b) => a.health.score - b.health.score)
    .slice(0, 5);

  return (
    <section className="dashboard-page">
      <header className="dashboard-title-row">
        <div>
          <h1>Ringkasan Proyek Internal</h1>
          <p>Kelola pekerjaan, kolaborasi tim, pelaporan, dan evaluasi proyek dalam satu workspace internal.</p>
        </div>
        {user.role !== "MEMBER" ? (
          <Link className="btn btn-primary" href="/projects/new">Buat proyek</Link>
        ) : (
          <Link className="btn btn-primary" href="/my-work">Buka Pekerjaan Saya</Link>
        )}
      </header>

      <div className="overview-metrics">
        <OverviewMetric icon={<FolderKanban />} label="Proyek Aktif" value={activeProjects.length} hint={`${projects.length} proyek dapat diakses`} tone="blue" />
        <OverviewMetric icon={<Clock3 />} label="Menunggu Review" value={summary.review} hint={`${summary.revision} task perlu revisi`} tone="amber" />
        <OverviewMetric icon={<AlertTriangle />} label="Task Blocked" value={summary.blocked} hint={summary.blocked ? "Perlu ditindaklanjuti tim" : "Tidak ada hambatan aktif"} tone="red" />
        <OverviewMetric icon={<CalendarDays />} label="Deadline Minggu Ini" value={deadlinesThisWeek} hint={`${summary.overdue} task sudah terlambat`} tone="violet" />
      </div>

      <div className="dashboard-primary-grid">
        <section className="dashboard-panel project-health-panel">
          <PanelHeader title="Health Proyek" href="/projects" />
          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead><tr><th>Proyek</th><th>PM</th><th>Deadline</th><th>Progress</th><th>Health</th></tr></thead>
              <tbody>
                {healthRows.map(({ project, health }) => (
                  <tr key={project.id}>
                    <td>
                      <Link className="project-cell" href={`/projects/${project.id}`}>
                        <span className="project-color-dot" />
                        <span><strong>{project.name}</strong><small>{project.clientName}</small></span>
                      </Link>
                    </td>
                    <td><span className="person-cell"><span className="avatar avatar-sm">{initials(project.lead)}</span>{project.lead}</span></td>
                    <td>{formatDate(project.deadline)}</td>
                    <td>
                      <div className="table-progress"><span>{project.progress}%</span><div className="progress-track"><i style={{ width: `${project.progress}%` }} /></div></div>
                    </td>
                    <td><span className={`health-pill ${health.tone}`}>{healthLabel(health.tone)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {healthRows.length === 0 ? <div className="dashboard-empty">Belum ada proyek aktif.</div> : null}
          </div>
        </section>

        <section className="dashboard-panel work-panel">
          <PanelHeader title={user.role === "MEMBER" ? "Pekerjaan Saya" : "Prioritas Pekerjaan"} href="/my-work" />
          <div className="work-list">
            {workItems.map((task) => (
              <Link href={`/projects/${task.projectId}`} className="work-row" key={`${task.projectId}-${task.id}`}>
                <div className="min-w-0 flex-1"><strong>{task.title}</strong><span>{task.projectName || "Project"}</span></div>
                <span className={`status-pill task-${task.status.toLowerCase()}`}>{TASK_STATUS_LABELS[task.status]}</span>
                <time className={isOverdue(task.dueDate, task.status) ? "overdue" : ""}>{formatDate(task.dueDate)}</time>
              </Link>
            ))}
            {workItems.length === 0 ? <div className="dashboard-empty">Tidak ada task aktif yang perlu dikerjakan.</div> : null}
          </div>
        </section>
      </div>

      <div className="dashboard-secondary-grid">
        <section className="dashboard-panel board-preview-panel">
          <PanelHeader title="Preview Board" href="/board" linkLabel="Lihat board" />
          <div className="board-preview-grid">
            {boardColumns.map((column) => {
              const columnTasks = tasks.filter((task) => task.status === column.status);
              return (
                <div className={`board-preview-column column-${column.status.toLowerCase()}`} key={column.status}>
                  <div className="board-preview-heading"><span>{column.label}</span><strong>{columnTasks.length}</strong></div>
                  <div className="board-preview-cards">
                    {columnTasks.slice(0, 2).map((task) => (
                      <Link href={`/projects/${task.projectId}`} className="board-mini-card" key={`${column.status}-${task.projectId}-${task.id}`}>
                        <strong>{task.title}</strong>
                        <span>{task.projectName || "Project"}</span>
                        <i className="avatar avatar-xs">{initials(task.assignee)}</i>
                      </Link>
                    ))}
                    {columnTasks.length === 0 ? <div className="board-column-empty">Belum ada task</div> : null}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="dashboard-panel activity-panel">
          <PanelHeader title="Aktivitas Terbaru" href="/projects" />
          <div className="recent-activity-list">
            {recentActivities.map((activity) => <ActivityItem activity={activity} key={`${activity.projectId}-${activity.id}`} />)}
            {recentActivities.length === 0 ? <div className="dashboard-empty">Aktivitas tim akan muncul di sini.</div> : null}
          </div>
        </section>

        <section className="dashboard-panel workload-panel">
          <PanelHeader title={user.role === "MEMBER" ? "Ringkasan Pekerjaan" : "Beban Kerja Tim"} href={user.role === "MEMBER" ? "/my-work" : "/reports"} linkLabel="Lihat laporan" />
          {user.role === "MEMBER" ? (
            <div className="member-work-summary">
              <WorkSummary label="Belum mulai" value={tasks.filter((task) => task.status === "TODO").length} />
              <WorkSummary label="Dikerjakan" value={tasks.filter((task) => task.status === "IN_PROGRESS").length} />
              <WorkSummary label="Review / Revisi" value={summary.review + summary.revision} />
              <WorkSummary label="Selesai" value={summary.done} />
            </div>
          ) : (
            <div className="workload-list">
              {workload.map((member) => (
                <div className="workload-row" key={member.uid}>
                  <span className="avatar avatar-sm">{initials(member.name)}</span>
                  <div className="workload-person"><strong>{member.name}</strong><span>{member.jobTitle || USER_ROLE_LABELS[member.role]}</span></div>
                  <div className="workload-value"><strong>{member.score}%</strong><div className="workload-track"><span className={workloadTone(member.score)} style={{ width: `${member.score}%` }} /></div></div>
                </div>
              ))}
              {workload.length === 0 ? <div className="dashboard-empty">Belum ada task aktif yang ditugaskan.</div> : null}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}

function OverviewMetric({ icon, label, value, hint, tone }: { icon: React.ReactNode; label: string; value: number; hint: string; tone: string }) {
  return (
    <article className="overview-metric-card">
      <span className={`overview-metric-icon ${tone}`}>{icon}</span>
      <div><p>{label}</p><strong>{value}</strong><span>{hint}</span></div>
    </article>
  );
}

function PanelHeader({ title, href, linkLabel = "Lihat semua" }: { title: string; href: string; linkLabel?: string }) {
  return (
    <div className="dashboard-panel-header">
      <h2>{title}</h2>
      <Link href={href}>{linkLabel} <ArrowUpRight className="size-3.5" /></Link>
    </div>
  );
}

function ActivityItem({ activity }: { activity: ProjectActivity & { projectName: string } }) {
  const attachmentActivity = activity.action.includes("ATTACHMENT");
  return (
    <Link href={`/projects/${activity.projectId}`} className="recent-activity-row">
      <span className="avatar avatar-sm">{initials(activity.actorName)}</span>
      <div className="min-w-0 flex-1">
        <p><strong>{activity.actorName}</strong> {activity.message}</p>
        <span>{activity.projectName} · {relativeTime(activity.createdAt)}</span>
      </div>
      {attachmentActivity ? <Paperclip className="size-4" /> : <MessageSquareText className="size-4" />}
    </Link>
  );
}

function WorkSummary({ label, value }: { label: string; value: number }) {
  return <div><span>{label}</span><strong>{value}</strong></div>;
}

function taskWeight(task: ProjectTask) {
  if (task.status === "DONE") return 0;
  const statusWeight: Record<TaskStatus, number> = { TODO: 1, IN_PROGRESS: 2, REVIEW: 1.3, REVISION: 2, BLOCKED: 2.2, DONE: 0 };
  const priorityWeight = { LOW: 0.8, MEDIUM: 1, HIGH: 1.3, URGENT: 1.6 }[task.priority];
  return statusWeight[task.status] * priorityWeight;
}

function initials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "NA";
  return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? parts[0]?.[1] ?? ""}`.toUpperCase();
}

function relativeTime(value: string) {
  const date = parseDateValue(value);
  if (!date) return "waktu tidak tersedia";
  const diffMinutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60_000));
  if (diffMinutes < 1) return "baru saja";
  if (diffMinutes < 60) return `${diffMinutes} menit lalu`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} jam lalu`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} hari lalu`;
}

function healthLabel(tone: "success" | "warning" | "danger" | "muted") {
  if (tone === "success") return "Baik";
  if (tone === "warning") return "Cukup";
  if (tone === "danger") return "Risiko";
  return "Tidak aktif";
}

function workloadTone(score: number) {
  if (score > 80) return "high";
  if (score > 50) return "medium";
  return "low";
}
