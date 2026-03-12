"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AuthUser {
  uid: string;
  email: string;
  username: string;
  role: string;
  points_balance: number;
  level: number;
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      loading: true,
      setUser: (user) => set({ user, loading: false }),
      setLoading: (loading) => set({ loading }),
      logout: () => set({ user: null, loading: false }),
    }),
    {
      name: "geoannotate-auth",
      partialize: (state) => ({ user: state.user }),
    }
  )
);
