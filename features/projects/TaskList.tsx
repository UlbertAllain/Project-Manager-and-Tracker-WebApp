"use client";

import { useMemo, useState, useTransition } from "react";
import { CalendarDays, GripVertical, Plus, Trash2, UserRound } from "lucide-react";
import { addTaskAction, deleteTaskAction, updateTaskStatusAction } from "@/features/projects/actions";
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  type ProjectTask,
  type TaskStatus,
} from "@/features/projects/types";
import type { UserProfile } from "@/features/users/types";
import { formatDate, isOverdue } from "@/lib/format";

export function TaskList({
  projectId,
  tasks: initialTasks,
  users,
  canManage,
  currentUserId,
}: {
  projectId: string;
  tasks: ProjectTask[];
  users: UserProfile[];
  canManage: boolean;
  currentUserId: string;
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const activeUsers = useMemo(() => users.filter((user) => user.isActive), [users]);

  function canUpdate(task: ProjectTask) {
    return canManage || task.assigneeId === currentUserId;
  }

  function moveTask(taskId: string, status: TaskStatus) {
    const task = tasks.find((item) => item.id === taskId);
    if (!task || task.status === status || !canUpdate(task)) return;
    const previous = tasks;
    setError("");
    setTasks((items) => items.map((item) => item.id === taskId ? { ...item, status, completed: status === "DONE" } : item));
    const formData = new FormData();
    formData.set("projectId", projectId);
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
    <section className="panel-card overflow-hidden">
      <div className="section-header">
        <div><span className="eyebrow">DELIVERY BOARD</span><h3>Pekerjaan project</h3><p>Task dapat dipindahkan sesuai tahap pengerjaan dan review.</p></div>
        <div className="flex items-center gap-2">{isPending ? <span className="saving-indicator">Menyimpan...</span> : null}{canManage ? <button className="btn btn-secondary" type="button" onClick={() => setShowForm((value) => !value)}><Plus className="size-4" /> Tambah task</button> : null}</div>
      </div>

      {showForm && canManage ? (
        <form action={async (formData) => { await addTaskAction(formData); setShowForm(false); }} className="task-create-panel">
          <input type="hidden" name="projectId" value={projectId} />
          <div className="md:col-span-2"><label className="label">Judul task</label><input className="input" name="title" placeholder="Apa yang harus diselesaikan?" required /></div>
          <div className="md:col-span-2"><label className="label">Deskripsi / acceptance criteria</label><textarea className="input min-h-24" name="description" placeholder="Jelaskan hasil yang dianggap selesai." /></div>
          <div><label className="label">Assignee</label><select className="input" name="assigneeId" onChange={(event) => {
            const select = event.currentTarget;
            const hidden = select.form?.elements.namedItem("assignee") as HTMLInputElement | null;
            if (hidden) hidden.value = select.options[select.selectedIndex]?.dataset.name ?? "Belum ditugaskan";
          }}><option data-name="Belum ditugaskan" value="">Belum ditugaskan</option>{activeUsers.map((user) => <option data-name={user.name} key={user.uid} value={user.uid}>{user.name} — {user.jobTitle || user.role.replaceAll("_", " ")}</option>)}</select><input type="hidden" name="assignee" defaultValue="Belum ditugaskan" /></div>
          <div><label className="label">Prioritas</label><select className="input" name="priority" defaultValue="MEDIUM">{TASK_PRIORITIES.map((value) => <option key={value} value={value}>{value}</option>)}</select></div>
          <div><label className="label">Deadline</label><input className="input" name="dueDate" type="date" /></div>
          <input type="hidden" name="status" value="TODO" />
          <div className="flex items-end gap-2"><button className="btn btn-primary flex-1" type="submit">Simpan task</button><button className="btn btn-secondary" type="button" onClick={() => setShowForm(false)}>Batal</button></div>
        </form>
      ) : null}

      {error ? <div className="m-4 alert-error">{error}</div> : null}

      <div className="kanban-scroll project-task-board">
        {TASK_STATUSES.map((status) => {
          const columnTasks = tasks.filter((task) => task.status === status);
          return (
            <section className="kanban-column task-column" key={status} onDragOver={(event) => event.preventDefault()} onDrop={(event) => {
              event.preventDefault();
              const taskId = draggedId || event.dataTransfer.getData("text/task-id");
              setDraggedId(null);
              if (taskId) moveTask(taskId, status);
            }}>
              <div className="kanban-column-header"><i className={`status-dot task-${status.toLowerCase()}`} /><h3>{TASK_STATUS_LABELS[status]}</h3><span>{columnTasks.length}</span></div>
              <div className="kanban-column-body">
                {columnTasks.map((task) => {
                  const editable = canUpdate(task);
                  return (
                    <article className={`work-task-card ${draggedId === task.id ? "dragging" : ""} ${!editable ? "readonly" : ""}`} draggable={editable} key={task.id} onDragStart={(event) => {
                      if (!editable) return;
                      setDraggedId(task.id);
                      event.dataTransfer.setData("text/task-id", task.id);
                      event.dataTransfer.effectAllowed = "move";
                    }} onDragEnd={() => setDraggedId(null)}>
                      <div className="flex items-start justify-between gap-2"><span className={`priority-chip priority-${task.priority.toLowerCase()}`}>{task.priority}</span>{editable ? <GripVertical className="size-4 text-[var(--text-subtle)]" /> : null}</div>
                      <h4>{task.title}</h4><p className="line-clamp-3">{task.description || "Belum ada detail pekerjaan."}</p>
                      <div className="task-card-meta"><span><UserRound className="size-3" /> {task.assignee}</span><span className={isOverdue(task.dueDate, task.status) ? "text-rose-400" : ""}><CalendarDays className="size-3" /> {formatDate(task.dueDate)}</span></div>
                      {canManage ? <form action={deleteTaskAction} className="mt-3 border-t border-[var(--border)] pt-2"><input type="hidden" name="projectId" value={projectId} /><input type="hidden" name="taskId" value={task.id} /><button className="task-delete" type="submit"><Trash2 className="size-3" /> Hapus task</button></form> : null}
                    </article>
                  );
                })}
                {columnTasks.length === 0 ? <div className="kanban-empty">Belum ada task</div> : null}
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
}
