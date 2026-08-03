"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { inMemoryPersistence, setPersistence, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { LoaderCircle, LogIn } from "lucide-react";
import { firebaseAuth } from "@/lib/firebase/client";

export function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");

    try {
      await setPersistence(firebaseAuth, inMemoryPersistence);
      const credential = await signInWithEmailAndPassword(firebaseAuth, email, password);
      const idToken = await credential.user.getIdToken(true);
      const response = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      if (!response.ok) throw new Error("Sesi gagal dibuat.");
      await signOut(firebaseAuth);
      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("Email atau password salah, atau akun belum dikonfigurasi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input className="input" id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <input className="input" id="password" name="password" type="password" autoComplete="current-password" minLength={8} required />
      </div>
      {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}
      <button className="btn btn-primary w-full" disabled={loading} type="submit">
        {loading ? <LoaderCircle className="size-4 animate-spin" /> : <LogIn className="size-4" />}
        {loading ? "Memverifikasi..." : "Masuk"}
      </button>
    </form>
  );
}
