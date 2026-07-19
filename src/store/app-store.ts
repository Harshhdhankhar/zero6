"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

// Profile type matching the Supabase profiles table
export interface Profile {
  id: string;
  email: string;
  name: string;
  username: string;
  avatar: string;
  bio: string;
  location: string;
  role: string;
  total_distance: number;
  total_runs: number;
  total_duration: number;
  current_streak: number;
  longest_streak: number;
  level: number;
  xp: number;
  xp_to_next_level: number;
  followers_count: number;
  following_count: number;
  created_at: string;
}

interface AppState {
  // Auth
  profile: Profile | null;
  isAuthenticated: boolean;

  // UI state
  sidebarCollapsed: boolean;
  unreadNotifications: number;
  searchOpen: boolean;

  // Actions
  setProfile: (profile: Profile | null) => void;
  setAuthenticated: (value: boolean) => void;
  logout: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setUnreadNotifications: (count: number) => void;
  setSearchOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Auth — starts unauthenticated
      profile: null,
      isAuthenticated: false,

      // UI defaults
      sidebarCollapsed: false,
      unreadNotifications: 0,
      searchOpen: false,

      // Auth actions
      setProfile: (profile) =>
        set({ profile, isAuthenticated: profile !== null }),

      setAuthenticated: (value) => set({ isAuthenticated: value }),

      logout: () =>
        set({
          profile: null,
          isAuthenticated: false,
          unreadNotifications: 0,
        }),

      // UI actions
      setSidebarCollapsed: (collapsed) =>
        set({ sidebarCollapsed: collapsed }),
      setUnreadNotifications: (count) =>
        set({ unreadNotifications: count }),
      setSearchOpen: (open) => set({ searchOpen: open }),
    }),
    {
      name: "zero6-store",
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        // Don't persist auth state — Supabase session cookies handle that
      }),
    }
  )
);
