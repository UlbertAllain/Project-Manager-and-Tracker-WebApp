"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AuthUser } from "@/lib/types";
import { useAuthStore } from "@/stores/auth-store";

type CreateUserPayload = {
  email: string;
  name: string;
  password: string;
  role: string;
};

async function fetchUsers(): Promise<AuthUser[]> {
  const res = await fetch("/api/users");
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Gagal mengambil data user");
  }

  return data.data || [];
}

async function createUser(payload: CreateUserPayload) {
  const userId = useAuthStore.getState().user?.id;
  const res = await fetch("/api/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(userId ? { "x-user-id": userId } : {}),
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Gagal membuat user");
  }

  return data.data;
}

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
