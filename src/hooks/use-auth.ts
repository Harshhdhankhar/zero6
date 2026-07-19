"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAppStore, type Profile } from "@/store/app-store";

export function useAuth() {
  const router = useRouter();
  const supabase = createClient();
  const profile = useAppStore((s) => s.profile);
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const setProfile = useAppStore((s) => s.setProfile);
  const logoutStore = useAppStore((s) => s.logout);

  const fetchProfile = useCallback(
    async (userId: string) => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (data && !error) {
        setProfile(data as Profile);
      }
      return data as Profile | null;
    },
    [supabase, setProfile]
  );

  useEffect(() => {
    let cancelled = false;

    const initAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (cancelled) return;

      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelled) return;
      if (event === "SIGNED_IN" && session?.user) {
        await fetchProfile(session.user.id);
      } else if (event === "SIGNED_OUT") {
        setProfile(null);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile, setProfile]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        await fetchProfile(data.user.id);
      }

      return data;
    },
    [supabase, fetchProfile]
  );

  const signup = useCallback(
    async (email: string, password: string, name: string, username: string) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, username },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      // Only fetch profile if we have an active session (email confirmation disabled)
      if (data.session && data.user) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        await fetchProfile(data.user.id);
      }

      return data;
    },
    [supabase, fetchProfile]
  );

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    logoutStore();
    router.push("/login");
  }, [supabase, logoutStore, router]);

  const updateProfile = useCallback(
    async (updates: Partial<Profile>) => {
      if (!profile) return;

      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", profile.id)
        .select()
        .single();

      if (data && !error) {
        setProfile(data as Profile);
      }

      return { data, error };
    },
    [supabase, profile, setProfile]
  );

  return {
    profile,
    isAuthenticated,
    login,
    signup,
    logout,
    updateProfile,
    fetchProfile,
  };
}
