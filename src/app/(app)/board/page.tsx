import { ProjectBoard } from "@/features/projects/ProjectBoard";
import { requireUser } from "@/lib/auth/guards";
import { listProjects } from "@/lib/repositories/projects";

export default async function BoardPage() {
  const user = await requireUser();
  const projects = await listProjects(user);
  return <ProjectBoard initialProjects={projects} user={user} />;
}
