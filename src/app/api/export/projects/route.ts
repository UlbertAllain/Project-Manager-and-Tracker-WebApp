import { getCurrentUser } from "@/lib/auth/session";
import { listProjects, listTasks } from "@/lib/repositories/projects";
import { projectHealth, taskSummary } from "@/lib/project-insights";
import { PRIORITY_LABELS, PROJECT_STATUS_LABELS } from "@/features/projects/types";

function escapeCsv(value: unknown) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role === "MEMBER") return new Response("Anda tidak memiliki akses untuk mengunduh laporan ini.", { status: 401 });
  const projects = await listProjects(user);
  const taskGroups = await Promise.all(projects.map((project) => listTasks(project.id, project.name)));
  const rows = [
    ["nama_proyek", "klien", "manajer_proyek", "tahap", "prioritas", "batas_waktu", "progres", "kondisi", "tugas_selesai", "total_tugas", "tugas_terhambat", "tugas_terlambat", "anggaran", "pembayaran_masuk", "pengeluaran"],
    ...projects.map((project, index) => {
      const summary = taskSummary(taskGroups[index]);
      const health = projectHealth(project, taskGroups[index]);
      return [project.name, project.clientName, project.lead, PROJECT_STATUS_LABELS[project.status], PRIORITY_LABELS[project.priority], project.deadline, project.progress, health.label, summary.done, summary.total, summary.blocked, summary.overdue, project.budget, project.paidAmount, project.totalExpense];
    }),
  ];
  const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
  return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=laporan-proyek-internal.csv" } });
}
