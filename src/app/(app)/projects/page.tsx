import Link from "next/link";
import { ArrowUpRight, CalendarDays, FolderKanban, Plus, UsersRound } from "lucide-react";
import { PROJECT_STATUS_LABELS } from "@/features/projects/types";
import { canManageProject, requireUser } from "@/lib/auth/guards";
import { formatDate, isOverdue } from "@/lib/format";
import { listProjects, listTasks } from "@/lib/repositories/projects";
import { projectHealth, taskSummary } from "@/lib/project-insights";

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const user = await requireUser();
  const { q = "" } = await searchParams;
  const query = q.trim().toLocaleLowerCase("id");
  const accessibleProjects = await listProjects(user);
  const projects = query
    ? accessibleProjects.filter((project) => [project.name, project.clientName, project.lead, project.category, ...project.techStack].join(" ").toLocaleLowerCase("id").includes(query))
    : accessibleProjects;
  const taskGroups = await Promise.all(projects.map((project) => listTasks(project.id, project.name)));
  const taskMap = new Map(projects.map((project, index) => [project.id, taskGroups[index]]));

  return (
    <section className="space-y-5">
      <header className="page-heading">
        <div><span className="eyebrow"><FolderKanban className="size-3.5" /> PORTOFOLIO PROYEK</span><h2>{query ? `Hasil pencarian “${q.trim()}”` : "Proyek"}</h2><p>{query ? `${projects.length} proyek ditemukan dari ${accessibleProjects.length} proyek yang dapat Anda akses.` : "Lihat proyek yang menjadi tanggung jawab Anda beserta kondisi pekerjaan tim."}</p></div>
        {user.role !== "MEMBER" ? <Link className="btn btn-primary btn-lg" href="/projects/new"><Plus className="size-4" /> Proyek Baru</Link> : null}
      </header>

      <div className="project-grid">
        {projects.map((project) => {
          const tasks = taskMap.get(project.id) ?? [];
          const health = projectHealth(project, tasks);
          const summary = taskSummary(tasks);
          return (
            <article className="project-card" key={project.id}>
              <div className="project-card-top">
                <div className="flex flex-wrap items-center gap-2"><span className={`health-badge ${health.tone}`}>{health.label}</span><span className="badge">{PROJECT_STATUS_LABELS[project.status]}</span>{canManageProject(user, project) ? <span className="manager-chip">Anda mengelola</span> : null}</div>
                <Link className="icon-button" href={`/projects/${project.id}`} aria-label={`Buka ${project.name}`}><ArrowUpRight className="size-4" /></Link>
              </div>
              <Link href={`/projects/${project.id}`} className="block">
                <h3>{project.name}</h3><p className="project-client">{project.clientName}</p>
                <p className="project-objective">{project.objective || project.description || "Tujuan proyek belum ditambahkan."}</p>
                <div className="project-progress"><div><span>Progres</span><strong>{project.progress}%</strong></div><div className="progress-track"><span style={{ width: `${project.progress}%` }} /></div></div>
                <div className="project-card-stats"><div><strong>{summary.total}</strong><span>Total tugas</span></div><div><strong>{summary.review + summary.revision}</strong><span>Tinjauan / revisi</span></div><div><strong>{summary.blocked}</strong><span>Terhambat</span></div></div>
                <div className="project-card-footer"><span><UsersRound className="size-3.5" /> {project.lead}</span><span className={isOverdue(project.deadline, project.status) ? "text-rose-400" : ""}><CalendarDays className="size-3.5" /> {formatDate(project.deadline)}</span></div>
              </Link>
            </article>
          );
        })}
        {projects.length === 0 ? <div className="panel-card empty-state col-span-full">{query ? "Tidak ada proyek yang sesuai dengan pencarian Anda." : user.role === "MEMBER" ? "Belum ada proyek yang diberikan kepada Anda." : "Belum ada proyek. Buat proyek pertama untuk mulai mengatur pekerjaan tim."}</div> : null}
      </div>
    </section>
  );
}
