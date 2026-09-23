"use client";

import { MessageSquareText, Send, Trash2 } from "lucide-react";
import { addCommentAction, deleteCommentAction } from "@/features/projects/actions";
import type { ProjectComment, ProjectTask } from "@/features/projects/types";
import type { SessionUser } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/format";

export function CommentSection({ projectId, comments, tasks, user }: { projectId: string; comments: ProjectComment[]; tasks: ProjectTask[]; user: SessionUser }) {
  return (
    <section className="panel-card overflow-hidden">
      <div className="section-header"><div><span className="eyebrow">LAPORAN INTERNAL</span><h3>Laporan dan Diskusi</h3><p>Catat perkembangan, kendala, revisi, dan keputusan sesuai konteks proyek.</p></div><span className="count-pill">{comments.length}</span></div>
      <form action={addCommentAction} className="comment-form-modern">
        <input type="hidden" name="projectId" value={projectId} />
        <div className="avatar">{user.name.slice(0, 2).toUpperCase()}</div>
        <div className="min-w-0 flex-1">
          <textarea className="input min-h-24 resize-y" name="message" placeholder="Tulis perkembangan pekerjaan, kendala, revisi, atau keputusan..." required />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <select className="compact-select" name="taskId" onChange={(event) => {
              const select = event.currentTarget;
              const hidden = select.form?.elements.namedItem("taskTitle") as HTMLInputElement | null;
              if (hidden) hidden.value = select.options[select.selectedIndex]?.dataset.title ?? "";
            }}>
              <option data-title="" value="">Umum untuk proyek</option>
              {tasks.map((task) => <option data-title={task.title} key={task.id} value={task.id}>Tugas: {task.title}</option>)}
            </select>
            <input type="hidden" name="taskTitle" />
            <button className="btn btn-primary" type="submit"><Send className="size-3.5" /> Kirim Laporan</button>
          </div>
        </div>
      </form>
      <div className="divide-y divide-[var(--border)]">
        {comments.map((comment) => (
          <article className="comment-row-modern" key={comment.id}>
            <div className="avatar">{comment.authorName.slice(0, 2).toUpperCase()}</div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1"><strong>{comment.authorName}</strong><span>{formatDateTime(comment.createdAt)}</span>{comment.taskTitle ? <span className="context-chip"><MessageSquareText className="size-3" /> {comment.taskTitle}</span> : null}</div>
              <p>{comment.message}</p>
            </div>
            {(user.role === "ADMIN" || comment.authorId === user.uid) ? <form action={deleteCommentAction}><input type="hidden" name="projectId" value={projectId} /><input type="hidden" name="commentId" value={comment.id} /><button className="icon-button danger" type="submit" aria-label="Hapus komentar"><Trash2 className="size-3.5" /></button></form> : null}
          </article>
        ))}
        {comments.length === 0 ? <div className="empty-state">Belum ada laporan. Tambahkan pembaruan pertama untuk mencatat perkembangan proyek.</div> : null}
      </div>
    </section>
  );
}
