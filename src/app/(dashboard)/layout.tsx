"use client";

import React from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { TopNavbar } from "@/components/layout/top-navbar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { useAuth } from "@/hooks/use-auth";
import { RunTrackingProvider } from "@/components/run/run-tracking-provider";
import { AchievementToast } from "@/components/dashboard/achievement-toast";
import { CommandPaletteProvider } from "@/contexts/command-palette-context";
import { CommandPalette } from "@/components/command-palette";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Initialize auth state from Supabase session
  useAuth();

  return (
    <CommandPaletteProvider>
      <RunTrackingProvider>
        <AchievementToast />
        <CommandPalette />
        <div className="min-h-screen bg-background">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        {/* Mobile Nav */}
        <MobileNav />

        {/* Main Content Area */}
        <div className="lg:pl-[280px] transition-all duration-300">
          {/* Desktop Top Navbar */}
          <div className="hidden lg:block">
            <TopNavbar />
          </div>

          {/* Page Content */}
          <main className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8">
            {children}
          </main>
        </div>
      </div>
    </RunTrackingProvider>
    </CommandPaletteProvider>
  );
}
