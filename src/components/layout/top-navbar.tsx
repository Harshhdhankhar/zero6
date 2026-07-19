"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Search,
  Bell,
  MessageCircle,
  Plus,
  Sun,
  Moon,
  Cloud,
  ChevronDown,
  LogOut,
  Settings,
  UserCircle,
  Activity,
  Calendar,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { weatherData } from "@/lib/weather-data";
import { useAppStore } from "@/store/app-store";
import { useCommandPalette } from "@/contexts/command-palette-context";

const weatherIcons: Record<string, React.ReactNode> = {
  sunny: <Sun className="h-4 w-4 text-yellow-500" />,
  cloudy: <Cloud className="h-4 w-4 text-gray-400" />,
  partly_cloudy: <Cloud className="h-4 w-4 text-blue-400" />,
  rainy: <Cloud className="h-4 w-4 text-blue-500" />,
  stormy: <Cloud className="h-4 w-4 text-purple-500" />,
  snowy: <Cloud className="h-4 w-4 text-cyan-300" />,
};

export function TopNavbar() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { open: openCommandPalette } = useCommandPalette();
  const [mounted, setMounted] = useState(false);
  const user = useAppStore((s) => s.profile);
  const storeLogout = useAppStore((s) => s.logout);
  const unreadNotifications = useAppStore((s) => s.unreadNotifications);
  const setUnreadNotifications = useAppStore((s) => s.setUnreadNotifications);
  const pathname = usePathname();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const createMenuRef = useRef<HTMLDivElement>(null);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Get page title from pathname
  const getPageTitle = () => {
    const segment = pathname.split("/").filter(Boolean).pop() || "dashboard";
    return segment.charAt(0).toUpperCase() + segment.slice(1);
  };

  // Fetch unread notification count
  useEffect(() => {
    if (!user) return;
    fetch("/api/notifications")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.meta?.unread != null) {
          setUnreadNotifications(json.meta.unread);
        }
      })
      .catch(() => {});
  }, [user, setUnreadNotifications]);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (createMenuRef.current && !createMenuRef.current.contains(e.target as Node)) {
        setCreateMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Global keyboard shortcut for command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        openCommandPalette();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [openCommandPalette]);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-card/80 backdrop-blur-xl px-6">
      {/* Page Title */}
      <div className="flex items-center gap-2">
        <h2 className="heading-lg text-lg font-semibold text-foreground">{getPageTitle()}</h2>
      </div>

      {/* Search */}
      <div className="flex-1 flex justify-center max-w-xl mx-auto">
        <button
          onClick={openCommandPalette}
          className="flex h-10 w-full max-w-md items-center gap-2 rounded-xl border border-border bg-secondary/50 px-4 text-sm text-muted-foreground transition-colors hover:bg-secondary cursor-pointer"
        >
          <Search className="h-4 w-4" />
          <span>Search runners, events, clubs...</span>
          <kbd className="ml-auto hidden rounded-lg bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground sm:inline-block">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3">
        {/* Weather Widget */}
        <div className="hidden lg:flex items-center gap-2 rounded-xl bg-secondary/50 border border-border px-4 py-2 text-sm">
          {weatherIcons[weatherData.condition]}
          <span className="font-medium text-foreground">{weatherData.temp}°</span>
          <span className="text-xs text-muted-foreground">AQI {weatherData.aqi}</span>
        </div>

        {/* Theme Toggle */}
        {mounted && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-10 w-10 rounded-xl hover:bg-secondary"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
        )}

        {/* Notifications */}
        <Link href="/notifications">
          <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-xl hover:bg-secondary">
            <Bell className="h-4 w-4" />
            {unreadNotifications > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {unreadNotifications > 9 ? "9+" : unreadNotifications}
              </span>
            )}
          </Button>
        </Link>

        {/* Messages */}
        <Link href="/messages">
          <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-xl hover:bg-secondary">
            <MessageCircle className="h-4 w-4" />
          </Button>
        </Link>

        {/* Quick Create */}
        <div className="relative" ref={createMenuRef}>
          <Button
            size="sm"
            className="btn-primary gap-2 rounded-xl"
            onClick={() => setCreateMenuOpen(!createMenuOpen)}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Create</span>
          </Button>
          {createMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-border bg-card p-2 shadow-xl animate-fade-in">
              <button
                onClick={() => {
                  setCreateMenuOpen(false);
                  router.push("/activities");
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-secondary cursor-pointer"
              >
                <Activity className="h-4 w-4 text-primary" />
                Log Activity
              </button>
              <button
                onClick={() => {
                  setCreateMenuOpen(false);
                  router.push("/events");
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-secondary cursor-pointer"
              >
                <Calendar className="h-4 w-4 text-primary" />
                Create Event
              </button>
              <button
                onClick={() => {
                  setCreateMenuOpen(false);
                  router.push("/communities");
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-secondary cursor-pointer"
              >
                <Users className="h-4 w-4 text-primary" />
                Create Club
              </button>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 rounded-xl p-2 transition-colors hover:bg-secondary cursor-pointer"
          >
            <Avatar className="h-9 w-9">
              <AvatarImage src={user?.avatar} alt={user?.name || "User"} />
              <AvatarFallback>{user?.name?.slice(0, 2).toUpperCase() || "U"}</AvatarFallback>
            </Avatar>
            <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", userMenuOpen && "rotate-180")} />
          </button>
          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-border bg-card p-2 shadow-xl animate-fade-in">
              <div className="px-3 py-2.5 border-b border-border mb-1">
                <p className="text-sm font-semibold text-foreground">{user?.name || "User"}</p>
                <p className="text-xs text-muted-foreground">@{user?.username || "user"}</p>
              </div>
              <Link
                href="/profile"
                onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-secondary text-foreground"
              >
                <UserCircle className="h-4 w-4" />
                Profile
              </Link>
              <Link
                href="/settings"
                onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-secondary text-foreground"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Link>
              <div className="my-1 h-px bg-border" />
              <button
                onClick={async () => {
                  const { createClient } = await import("@/lib/supabase/client");
                  const supabase = createClient();
                  await supabase.auth.signOut();
                  storeLogout();
                  router.push("/login");
                  router.refresh();
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-destructive transition-colors hover:bg-destructive/10 cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
