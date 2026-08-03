import { db } from "@/lib/db";
import { getTaskDueInfo } from "@/lib/helpers";

function escapeCsv(value: unknown): string {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function formatDate(value?: string | null): string {
  if (!value) return "";
  return new Date(value).toLocaleDateString("id-ID");
}

export async function GET() {
  try {
    const projects = await db.project.findMany({
      include: {
        tasks: true,
        transactions: true,
      },
    });

    const headers = [
      "Project",
      "Client",
      "Lead",
      "Status",
      "Priority",
      "Category",
      "Progress",
      "Budget",
      "Paid",
      "Expense",
      "Payment Status",
      "Task Done",
      "Task Total",
      "Task Overdue",
      "Task Due Today",
      "Start Date",
      "Deadline",
      "Completed Date",
    ];

    const rows = projects.map((project) => {
      const taskDone = project.tasks.filter((task) => task.isCompleted).length;
      const taskOverdue = project.tasks.filter(
        (task) => getTaskDueInfo(task.dueDate, task.isCompleted).severity === "OVERDUE"
      ).length;
      const taskDueToday = project.tasks.filter(
        (task) => getTaskDueInfo(task.dueDate, task.isCompleted).severity === "DUE_TODAY"
      ).length;

      return [
        project.projectName,
        project.clientName,
        project.projectLead,
        project.status,
        project.priority,
        project.category,
        `${project.progress}%`,
        project.budget,
        project.paidAmount,
        project.totalExpense,
        project.paymentStatus,
        taskDone,
        project.tasks.length,
        taskOverdue,
        taskDueToday,
        formatDate(project.startDate),
        formatDate(project.deadline),
        formatDate(project.completedDate),
      ].map(escapeCsv).join(",");
    });

    const csv = [headers.map(escapeCsv).join(","), ...rows].join("\n");

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="project-report-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    console.error("GET /api/reports/projects error:", error);
    return Response.json({ error: "Gagal membuat laporan project" }, { status: 500 });
  }
}
