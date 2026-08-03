import { getCurrentUser } from "@/lib/auth/session";
import { listProjects, listTasks } from "@/lib/repositories/projects";
import { projectHealth, taskSummary } from "@/lib/project-insights";

function escapeCsv(value: unknown) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role === "MEMBER") return new Response("Unauthorized", { status: 401 });
  const projects = await listProjects(user);
  const taskGroups = await Promise.all(projects.map((project) => listTasks(project.id, project.name)));
  const rows = [
    ["project", "client", "project_manager", "status", "priority", "deadline", "progress", "health", "task_done", "task_total", "task_blocked", "task_overdue", "budget", "paid", "expense"],
    ...projects.map((project, index) => {
      const summary = taskSummary(taskGroups[index]);
      const health = projectHealth(project, taskGroups[index]);
      return [project.name, project.clientName, project.lead, project.status, project.priority, project.deadline, project.progress, health.label, summary.done, summary.total, summary.blocked, summary.overdue, project.budget, project.paidAmount, project.totalExpense];
    }),
  ];
  const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
  return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=internal-project-report.csv" } });
}
