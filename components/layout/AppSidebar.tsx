"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Building2,
  CalendarRange,
  Columns3,
  BriefcaseBusiness,
  ListChecks,
  Menu,
  Settings,
  UsersRound,
  WalletCards,
  X,
} from "lucide-react";
import { LogoutButton } from "@/features/auth/LogoutButton";
import type { SessionUser } from "@/lib/auth/session";

const items = [
  { href: "/dashboard", label: "Ringkasan", icon: BarChart3, roles: ["ADMIN", "PROJECT_MANAGER", "MEMBER"] },
  { href: "/projects", label: "Proyek", icon: CalendarRange, roles: ["ADMIN", "PROJECT_MANAGER", "MEMBER"] },
  { href: "/my-work", label: "Pekerjaan Saya", icon: ListChecks, roles: ["ADMIN", "PROJECT_MANAGER", "MEMBER"] },
  { href: "/board", label: "Board", icon: Columns3, roles: ["ADMIN", "PROJECT_MANAGER", "MEMBER"] },
  { href: "/team", label: "Tim", icon: UsersRound, roles: ["ADMIN", "PROJECT_MANAGER"] },
  { href: "/reports", label: "Laporan", icon: BriefcaseBusiness, roles: ["ADMIN", "PROJECT_MANAGER"] },
  { href: "/finance", label: "Keuangan", icon: WalletCards, roles: ["ADMIN"] },
  { href: "/settings", label: "Pengaturan", icon: Settings, roles: ["ADMIN", "PROJECT_MANAGER", "MEMBER"] },
] as const;

export function AppSidebar({ user }: { user: SessionUser }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const visibleItems = items.filter((item) => (item.roles as readonly string[]).includes(user.role));

  return (
    <div className="sidebar-region">
      <div className="mobile-sidebar-bar">
        <Link className="mobile-sidebar-brand" href="/dashboard">
          <span className="sidebar-logo">N</span>
          <span>Nexty Workspace</span>
        </Link>
        <button className="mobile-menu-button" type="button" onClick={() => setOpen(true)} aria-label="Buka navigasi">
          <Menu className="size-5" />
        </button>
      </div>

      <button
        className={`mobile-sidebar-overlay ${open ? "visible" : ""}`}
        type="button"
        aria-label="Tutup navigasi"
        onClick={() => setOpen(false)}
      />

      <aside className={`app-sidebar ${open ? "mobile-open" : ""}`}>
        <div className="sidebar-brand">
          <Link className="flex min-w-0 flex-1 items-center gap-3" href="/dashboard" onClick={() => setOpen(false)} aria-label="Nexty Workspace">
            <div className="sidebar-logo">N</div>
            <div className="min-w-0">
              <strong>Nexty Workspace</strong>
              <span>Internal Project Management</span>
            </div>
          </Link>
          <button className="mobile-sidebar-close" type="button" onClick={() => setOpen(false)} aria-label="Tutup navigasi">
            <X className="size-5" />
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Navigasi utama">
          {visibleItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href === "/projects" && pathname.startsWith("/projects/"));
            return (
              <Link key={href} href={href} className={`sidebar-link ${active ? "active" : ""}`} onClick={() => setOpen(false)}>
                <Icon className="size-[18px]" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="workspace-switcher">
            <span className="workspace-switcher-icon"><Building2 className="size-4" /></span>
            <div className="min-w-0 flex-1">
              <strong>PT Nexty Digital</strong>
              <span>Workspace internal</span>
            </div>
          </div>
          <LogoutButton compact />
        </div>
      </aside>
    </div>
  );
}
