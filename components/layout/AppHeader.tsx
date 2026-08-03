import { CalendarDays, Search } from "lucide-react";
import type { SessionUser } from "@/lib/auth/session";
import { USER_ROLE_LABELS } from "@/features/users/types";

export function AppHeader({ user }: { user: SessionUser }) {
  const today = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <header className="app-header">
      <form action="/projects" className="header-search" method="GET">
        <Search className="size-4" aria-hidden />
        <input name="q" placeholder="Cari proyek, klien, atau project manager..." aria-label="Cari proyek" />
      </form>

      <div className="header-workspace-title">Workspace Internal</div>

      <div className="header-actions">
        <span className="header-date"><CalendarDays className="size-4" /> {today}</span>
        <div className="header-profile">
          <span className="avatar">{user.name.slice(0, 2).toUpperCase()}</span>
          <div className="min-w-0">
            <strong>{user.name}</strong>
            <span>{USER_ROLE_LABELS[user.role]}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
