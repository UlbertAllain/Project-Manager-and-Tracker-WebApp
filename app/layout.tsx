import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nexty Workspace — Internal Project Management",
  description: "Sistem internal untuk mengatur pekerjaan, kolaborasi, pelaporan, dan evaluasi project perusahaan.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>;
}
