"use client";

import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { LogOut } from "lucide-react";
import { firebaseAuth } from "@/lib/firebase/client";

export function LogoutButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();

  async function logout() {
    await Promise.allSettled([
      signOut(firebaseAuth),
      fetch("/api/session", { method: "DELETE" }),
    ]);
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      aria-label="Keluar dari workspace"
      className={compact ? "sidebar-logout" : "btn btn-secondary w-full"}
      onClick={logout}
      type="button"
    >
      <LogOut className="size-4" /> {compact ? <span>Keluar</span> : "Keluar"}
    </button>
  );
}
