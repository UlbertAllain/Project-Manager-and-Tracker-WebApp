import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nexty Workspace — Manajemen Proyek Internal",
  description: "Kelola proyek, pembagian tugas, kolaborasi, pelaporan, dan evaluasi kerja tim dalam satu ruang internal.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>;
}
