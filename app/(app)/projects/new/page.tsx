import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ProjectForm } from "@/features/projects/ProjectForm";
import { requireProjectManager } from "@/lib/auth/guards";
import { listUsers } from "@/lib/repositories/users";

export default async function NewProjectPage() {
  await requireProjectManager();
  const users = await listUsers();
  return (
    <section className="space-y-5">
      <header className="page-heading">
        <div><Link className="back-link" href="/projects"><ChevronLeft className="size-4" /> Kembali ke proyek</Link><h2>Proyek baru</h2><p>Bangun struktur kerja yang jelas sejak proyek dimulai.</p></div>
      </header>
      <ProjectForm users={users} />
    </section>
  );
}
