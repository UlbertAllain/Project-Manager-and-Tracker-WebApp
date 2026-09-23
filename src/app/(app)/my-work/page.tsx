import { ListChecks } from "lucide-react";
import { MyWorkBoard } from "@/features/projects/MyWorkBoard";
import { requireUser } from "@/lib/auth/guards";
import { listProjects, listTasksForUser } from "@/lib/repositories/projects";

export default async function MyWorkPage() {
  const user = await requireUser();
  const projects = await listProjects(user);
  const tasks = await listTasksForUser(user, projects);
  return (
    <section className="space-y-5">
      <header className="page-heading"><div><span className="eyebrow"><ListChecks className="size-3.5" /> DAFTAR TUGAS</span><h2>Pekerjaan Saya</h2><p>{user.role === "MEMBER" ? "Lihat dan perbarui semua tugas yang diberikan kepada Anda." : "Lihat tugas yang Anda kerjakan dan pekerjaan yang perlu ditinjau."}</p></div></header>
      <MyWorkBoard initialTasks={tasks} />
    </section>
  );
}
