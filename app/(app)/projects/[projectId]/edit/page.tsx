import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { ProjectForm } from "@/features/projects/ProjectForm";
import { canManageProject, requireUser } from "@/lib/auth/guards";
import { getProject } from "@/lib/repositories/projects";
import { listUsers } from "@/lib/repositories/users";

export default async function EditProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
  const user = await requireUser();
  const { projectId } = await params;
  const [project, users] = await Promise.all([getProject(projectId), listUsers()]);
  if (!project || !canManageProject(user, project)) notFound();
  return (
    <section className="space-y-5">
      <header className="page-heading">
        <div><Link className="back-link" href={`/projects/${projectId}`}><ChevronLeft className="size-4" /> Kembali ke Detail Proyek</Link><h2>Edit Proyek</h2><p>Perbarui penanggung jawab, target, jadwal, dan informasi proyek.</p></div>
      </header>
      <ProjectForm project={project} users={users} />
    </section>
  );
}
