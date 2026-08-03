import Link from "next/link";
import { AlertTriangle, BarChart3, CheckCircle2, Download, ShieldAlert, Trophy, UsersRound } from "lucide-react";
import { PROJECT_STATUS_LABELS } from "@/features/projects/types";
import { requireProjectManager } from "@/lib/auth/guards";
import { formatDate, isOverdue } from "@/lib/format";
import { projectHealth, taskSummary } from "@/lib/project-insights";
import { listProjects, listTasks } from "@/lib/repositories/projects";

export default async function ReportsPage() {
  const user = await requireProjectManager();
  const projects = await listProjects(user);
  const groups = await Promise.all(projects.map((project) => listTasks(project.id, project.name)));
  const tasks = groups.flat();
  const summary = taskSummary(tasks);
  const completedProjects = projects.filter((project) => project.status === "COMPLETED").length;
  const risky = projects.filter((project, index) => projectHealth(project, groups[index]).tone === "danger");

  const memberMap = new Map<string, { name: string; total: number; done: number; overdue: number; blocked: number }>();
  tasks.forEach((task) => {
    const key = task.assigneeId || task.assignee;
    if (!key || task.assignee === "Belum ditugaskan") return;
    const current = memberMap.get(key) ?? { name: task.assignee, total: 0, done: 0, overdue: 0, blocked: 0 };
    current.total += 1;
    if (task.status === "DONE") current.done += 1;
    if (task.status === "BLOCKED") current.blocked += 1;
    if (task.status !== "DONE" && isOverdue(task.dueDate, task.status)) current.overdue += 1;
    memberMap.set(key, current);
  });
  const members = Array.from(memberMap.values()).sort((a, b) => b.total - a.total);

  return (
    <section className="space-y-5">
      <header className="page-heading">
        <div>
          <span className="eyebrow"><BarChart3 className="size-3.5" /> Kinerja & evaluasi</span>
          <h2>Laporan</h2>
          <p>Evaluasi pelaksanaan proyek dan beban kerja tim berdasarkan data operasional.</p>
        </div>
        <a className="btn btn-secondary" href="/api/export/projects"><Download className="size-4" /> Export CSV</a>
      </header>

      <div className="dashboard-metrics">
        <Metric icon={<CheckCircle2 />} label="Proyek selesai" value={String(completedProjects)} hint={`dari ${projects.length} proyek`} />
        <Metric icon={<ShieldAlert />} label="Proyek berisiko" value={String(risky.length)} hint="berdasarkan deadline dan task" danger={risky.length > 0} />
        <Metric icon={<Trophy />} label="Penyelesaian task" value={`${summary.total ? Math.round((summary.done / summary.total) * 100) : 0}%`} hint={`${summary.done} dari ${summary.total} task`} />
        <Metric icon={<AlertTriangle />} label="Task terlambat" value={String(summary.overdue)} hint={`${summary.blocked} task blocked`} danger={summary.overdue + summary.blocked > 0} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
        <section className="panel-card overflow-hidden">
          <div className="section-header"><div><span className="eyebrow">Kondisi proyek</span><h3>Evaluasi portofolio</h3><p>Gunakan data ini untuk menentukan proyek yang perlu diprioritaskan.</p></div></div>
          <div className="report-project-list">
            {projects.map((project, index) => {
              const health = projectHealth(project, groups[index]);
              const tasksForProject = taskSummary(groups[index]);
              return (
                <Link className="report-project-row" href={`/projects/${project.id}`} key={project.id}>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2"><strong>{project.name}</strong><span className={`health-badge ${health.tone}`}>{health.label}</span></div>
                    <p>{project.clientName} · {PROJECT_STATUS_LABELS[project.status]} · deadline {formatDate(project.deadline)}</p>
                  </div>
                  <div className="report-score"><strong>{health.score}</strong><span>Health score</span></div>
                  <div className="report-task-mini"><span>{tasksForProject.done}/{tasksForProject.total} selesai</span><span>{tasksForProject.blocked} blocked</span></div>
                </Link>
              );
            })}
            {projects.length === 0 ? <div className="empty-state">Belum ada data proyek.</div> : null}
          </div>
        </section>

        <section className="panel-card overflow-hidden">
          <div className="section-header"><div><span className="eyebrow">Kinerja tim</span><h3>Distribusi pekerjaan</h3><p>Bukan ranking individu; gunakan untuk melihat kapasitas dan hambatan.</p></div><UsersRound className="size-5 text-[var(--brand)]" /></div>
          <div className="member-performance-list">
            {members.map((member) => {
              const completion = member.total ? Math.round((member.done / member.total) * 100) : 0;
              return (
                <article className="member-performance" key={member.name}>
                  <div className="avatar">{member.name.slice(0, 2).toUpperCase()}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3"><strong>{member.name}</strong><span>{completion}% selesai</span></div>
                    <div className="progress-track mt-2"><span style={{ width: `${completion}%` }} /></div>
                    <p>{member.total} task · {member.overdue} overdue · {member.blocked} blocked</p>
                  </div>
                </article>
              );
            })}
            {members.length === 0 ? <div className="empty-state">Belum ada task yang memiliki assignee.</div> : null}
          </div>
        </section>
      </div>
    </section>
  );
}

function Metric({ icon, label, value, hint, danger = false }: { icon: React.ReactNode; label: string; value: string; hint: string; danger?: boolean }) {
  return <div className={`dashboard-metric ${danger ? "danger" : ""}`}><div className="dashboard-metric-icon">{icon}</div><div><p>{label}</p><strong>{value}</strong><span>{hint}</span></div></div>;
}
