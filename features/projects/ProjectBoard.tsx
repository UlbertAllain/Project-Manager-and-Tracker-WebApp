"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { CalendarDays, GripVertical, LayoutGrid, Search, UserRound } from "lucide-react";
import { updateProjectStatusAction } from "@/features/projects/actions";
import { PROJECT_STATUSES, PROJECT_STATUS_LABELS, type Project, type ProjectStatus } from "@/features/projects/types";
import type { SessionUser } from "@/lib/auth/session";
import { formatDate, isOverdue } from "@/lib/format";

export function ProjectBoard({ initialProjects, user }: { initialProjects: Project[]; user: SessionUser }) {
  const [projects, setProjects] = useState(initialProjects);
  const [draggedProjectId, setDraggedProjectId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const categories = useMemo(() => Array.from(new Set(projects.map((project) => project.category).filter(Boolean))).sort(), [projects]);
  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();
    return projects.filter((project) => {
      const match = !query || [project.name, project.clientName, project.lead].some((value) => value.toLowerCase().includes(query));
      return match && (category === "ALL" || project.category === category);
    });
  }, [category, projects, search]);

  function canMove(project: Project) {
    if (user.role === "ADMIN") return true;
    if (user.role !== "PROJECT_MANAGER") return false;
    return !project.leadId || project.leadId === user.uid || project.createdBy === user.uid;
  }

  function moveProject(projectId: string, status: ProjectStatus) {
    const current = projects.find((project) => project.id === projectId);
    if (!current || current.status === status || !canMove(current)) return;
    const previous = projects;
    setError("");
    setProjects((items) => items.map((project) => project.id === projectId ? { ...project, status, ...(status === "COMPLETED" ? { progress: 100 } : {}) } : project));
    const formData = new FormData();
    formData.set("projectId", projectId);
    formData.set("status", status);
    startTransition(async () => {
      try {
        await updateProjectStatusAction(formData);
      } catch {
        setProjects(previous);
        setError("Status project gagal disimpan. Posisi kartu dikembalikan.");
      }
    });
  }

  return (
    <section className="space-y-5">
      <header className="page-heading">
        <div><span className="eyebrow"><LayoutGrid className="size-3.5" /> PROJECT FLOW</span><h2>Project Board</h2><p>{user.role === "MEMBER" ? "Lihat alur project yang kamu ikuti. Perubahan status dikendalikan oleh PM." : "Drag project antar fase agar portfolio selalu mencerminkan kondisi nyata."}</p></div>
      </header>
      <div className="toolbar-card">
        <label className="search-field"><Search className="size-4" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari project, client, atau PM..." /></label>
        <select className="compact-select" value={category} onChange={(event) => setCategory(event.target.value)}><option value="ALL">Semua kategori</option>{categories.map((value) => <option key={value} value={value}>{value}</option>)}</select>
        {isPending ? <span className="saving-indicator">Menyimpan...</span> : null}
      </div>
      {error ? <div className="alert-error">{error}</div> : null}
      <div className="kanban-scroll project-board">
        {PROJECT_STATUSES.map((status) => {
          const columnProjects = filteredProjects.filter((project) => project.status === status);
          return (
            <section className="kanban-column" key={status} onDragOver={(event) => event.preventDefault()} onDrop={(event) => {
              event.preventDefault();
              const projectId = draggedProjectId || event.dataTransfer.getData("text/project-id");
              setDraggedProjectId(null);
              if (projectId) moveProject(projectId, status);
            }}>
              <div className="kanban-column-header"><i className={`status-dot status-${status.toLowerCase()}`} /><h3>{PROJECT_STATUS_LABELS[status]}</h3><span>{columnProjects.length}</span></div>
              <div className="kanban-column-body">
                {columnProjects.map((project) => {
                  const movable = canMove(project);
                  return (
                    <article className={`kanban-card ${draggedProjectId === project.id ? "dragging" : ""} ${!movable ? "readonly" : ""}`} draggable={movable} key={project.id} onDragStart={(event) => {
                      if (!movable) return;
                      setDraggedProjectId(project.id);
                      event.dataTransfer.effectAllowed = "move";
                      event.dataTransfer.setData("text/project-id", project.id);
                    }} onDragEnd={() => setDraggedProjectId(null)}>
                      <Link href={`/projects/${project.id}`}>
                        <div className="flex items-start justify-between gap-2"><span className={`priority-chip priority-${project.priority.toLowerCase()}`}>{project.priority}</span>{movable ? <GripVertical className="size-4 text-[var(--text-subtle)]" /> : null}</div>
                        <h4>{project.name}</h4><p className="client-name">{project.clientName}</p>
                        <div className="mt-4"><div className="mb-1.5 flex justify-between text-[10px]"><span className="text-[var(--text-subtle)]">Progress</span><strong>{project.progress}%</strong></div><div className="progress-track"><span style={{ width: `${project.progress}%` }} /></div></div>
                        <div className="card-meta-grid"><span><UserRound className="size-3" /> {project.lead}</span><span className={isOverdue(project.deadline, project.status) ? "text-rose-400" : ""}><CalendarDays className="size-3" /> {formatDate(project.deadline)}</span></div>
                      </Link>
                    </article>
                  );
                })}
                {columnProjects.length === 0 ? <div className="kanban-empty">Belum ada project</div> : null}
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
}
