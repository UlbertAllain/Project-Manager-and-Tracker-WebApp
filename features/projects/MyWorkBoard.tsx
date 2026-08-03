"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { CalendarDays, Search, UserRound } from "lucide-react";
import { updateTaskStatusAction } from "@/features/projects/actions";
import { TASK_STATUSES, TASK_STATUS_LABELS, type ProjectTask, type TaskStatus } from "@/features/projects/types";
import { formatDate, isOverdue } from "@/lib/format";

export function MyWorkBoard({ initialTasks }: { initialTasks: ProjectTask[] }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return tasks;
    return tasks.filter((task) => [task.title, task.projectName, task.assignee].some((value) => value?.toLowerCase().includes(needle)));
  }, [query, tasks]);

  function moveTask(taskId: string, status: TaskStatus) {
    const current = tasks.find((task) => task.id === taskId);
    if (!current || current.status === status) return;
    const previous = tasks;
    setError("");
    setTasks((items) => items.map((task) => task.id === taskId ? { ...task, status, completed: status === "DONE" } : task));
    const formData = new FormData();
    formData.set("projectId", current.projectId);
    formData.set("taskId", taskId);
    formData.set("status", status);
    startTransition(async () => {
      try {
        await updateTaskStatusAction(formData);
      } catch {
        setTasks(previous);
        setError("Status task gagal disimpan. Perubahan dikembalikan.");
      }
    });
  }

  return (
    <section className="space-y-4">
      <div className="toolbar-card">
        <label className="search-field"><Search className="size-4" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari task atau project..." /></label>
        {isPending ? <span className="saving-indicator">Menyimpan perubahan...</span> : <span className="toolbar-note">Drag kartu untuk update status</span>}
      </div>
      {error ? <div className="alert-error">{error}</div> : null}
      <div className="kanban-scroll work-board">
        {TASK_STATUSES.map((status) => {
          const columnTasks = filtered.filter((task) => task.status === status);
          return (
            <section className="kanban-column task-column" key={status} onDragOver={(event) => event.preventDefault()} onDrop={(event) => {
              event.preventDefault();
              const taskId = draggedId || event.dataTransfer.getData("text/task-id");
              setDraggedId(null);
              if (taskId) moveTask(taskId, status);
            }}>
              <div className="kanban-column-header"><i className={`status-dot task-${status.toLowerCase()}`} /><h3>{TASK_STATUS_LABELS[status]}</h3><span>{columnTasks.length}</span></div>
              <div className="kanban-column-body">
                {columnTasks.map((task) => (
                  <article className={`work-task-card ${draggedId === task.id ? "dragging" : ""}`} draggable key={`${task.projectId}-${task.id}`} onDragStart={(event) => {
                    setDraggedId(task.id);
                    event.dataTransfer.setData("text/task-id", task.id);
                    event.dataTransfer.effectAllowed = "move";
                  }} onDragEnd={() => setDraggedId(null)}>
                    <Link href={`/projects/${task.projectId}`}>
                      <div className="flex items-start justify-between gap-2"><span className={`priority-dot priority-${task.priority.toLowerCase()}`} /><span className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-subtle)]">{task.priority}</span></div>
                      <h4>{task.title}</h4>
                      <p className="line-clamp-2">{task.description || "Tidak ada deskripsi tambahan."}</p>
                      <div className="task-card-project">{task.projectName || "Project"}</div>
                      <div className="task-card-meta"><span><UserRound className="size-3" /> {task.assignee}</span><span className={isOverdue(task.dueDate, task.status) ? "text-rose-400" : ""}><CalendarDays className="size-3" /> {formatDate(task.dueDate)}</span></div>
                    </Link>
                  </article>
                ))}
                {columnTasks.length === 0 ? <div className="kanban-empty">Belum ada task</div> : null}
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
}
