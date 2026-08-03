import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { requireUser } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="app-shell clean-workspace">
      <AppSidebar user={user} />
      <div className="app-content">
        <AppHeader user={user} />
        <main className="app-main">
          <div className="page-container">{children}</div>
        </main>
      </div>
    </div>
  );
}
