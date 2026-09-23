"use client";

import { ExternalLink, Link2, Trash2 } from "lucide-react";
import { addAttachmentAction, deleteAttachmentAction } from "@/features/projects/actions";
import { ATTACHMENT_PLATFORMS, type ProjectAttachment, type ProjectTask } from "@/features/projects/types";
import type { SessionUser } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/format";

export function AttachmentSection({ projectId, attachments, tasks, user }: { projectId: string; attachments: ProjectAttachment[]; tasks: ProjectTask[]; user: SessionUser }) {
  return (
    <section className="panel-card overflow-hidden">
      <div className="section-header"><div><span className="eyebrow">LAMPIRAN PROYEK</span><h3>Lampiran dan Referensi</h3><p>Simpan dokumen, desain, tautan pekerjaan, hasil pengujian, dan berkas final proyek.</p></div><span className="count-pill">{attachments.length}</span></div>
      <form action={addAttachmentAction} className="attachment-form-modern">
        <input type="hidden" name="projectId" value={projectId} />
        <input className="input" name="title" placeholder="Judul lampiran" required />
        <input className="input" name="url" type="url" placeholder="https://drive.google.com/..." required />
        <select className="input" name="platform" defaultValue="Google Drive">{ATTACHMENT_PLATFORMS.map((platform) => <option key={platform}>{platform}</option>)}</select>
        <select className="input" name="taskId" onChange={(event) => {
          const select = event.currentTarget;
          const hidden = select.form?.elements.namedItem("taskTitle") as HTMLInputElement | null;
          if (hidden) hidden.value = select.options[select.selectedIndex]?.dataset.title ?? "";
        }}><option data-title="" value="">Umum untuk proyek</option>{tasks.map((task) => <option data-title={task.title} key={task.id} value={task.id}>Tugas: {task.title}</option>)}</select>
        <input type="hidden" name="taskTitle" />
        <button className="btn btn-primary" type="submit"><Link2 className="size-3.5" /> Tambah Lampiran</button>
      </form>
      <div className="attachment-grid">
        {attachments.map((attachment) => (
          <article className="attachment-card" key={attachment.id}>
            <div className="attachment-icon"><Link2 className="size-4" /></div>
            <div className="min-w-0 flex-1"><a href={attachment.url} rel="noreferrer" target="_blank"><strong>{attachment.title}</strong><ExternalLink className="size-3" /></a><p>{attachment.platform} · {attachment.creatorName}</p><span>{attachment.taskTitle || "Umum untuk proyek"} · {formatDateTime(attachment.createdAt)}</span></div>
            {(user.role === "ADMIN" || attachment.createdBy === user.uid) ? <form action={deleteAttachmentAction}><input type="hidden" name="projectId" value={projectId} /><input type="hidden" name="attachmentId" value={attachment.id} /><button className="icon-button danger" type="submit" aria-label="Hapus lampiran"><Trash2 className="size-3.5" /></button></form> : null}
          </article>
        ))}
        {attachments.length === 0 ? <div className="empty-state col-span-full">Belum ada lampiran. Tambahkan dokumen atau tautan yang berkaitan dengan proyek ini.</div> : null}
      </div>
    </section>
  );
}
