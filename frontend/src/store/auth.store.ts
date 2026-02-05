"use client";

import { create } from "zustand";
import { authApi } from "@/lib/api/api";

type Role = "SELLER" | "ORG_ADMIN";

interface User {
  token: string;
  userId: string;
  profileId: string;
  email: string;
  role: Role;
}

interface AuthStore {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, role?: Role) => Promise<void>;
  register: (email: string, password: string, role: Role, businessName: string, location?: string) => Promise<void>;
  logout: () => void;
  init: () => void;
}

export const useAuth = create<AuthStore>((set, get) => ({
  user: null,
  loading: true,

  login: async (email, password, role) => {
    const data = await authApi.login({ email, password, role });
    const user = { token: data.token, userId: data.userId, profileId: data.profileId, email: data.email, role: data.role };
    localStorage.setItem("auth", JSON.stringify(user));
    set({ user });
  },

  register: async (email, password, role, businessName, location) => {
    const data = await authApi.register({ email, password, role, businessName, location });
    const user = { token: data.token, userId: data.userId, profileId: data.profileId, email: data.email, role: data.role };
    localStorage.setItem("auth", JSON.stringify(user));
    set({ user });
  },

  logout: () => {
    localStorage.removeItem("auth");
    set({ user: null });
  },

  init: () => {
    if (typeof window === "undefined") return set({ loading: false });
    const stored = localStorage.getItem("auth");
    if (stored) {
      set({ user: JSON.parse(stored), loading: false });
    } else {
      set({ loading: false });
    }
  },
}));
