"use client";

import React from "react";
import { motion } from "framer-motion";
import { useAppStore } from "@/store/app-store";
import { useTheme } from "next-themes";
import { TodayGoal } from "@/components/dashboard/today-goal";
import { WeeklyGoal } from "@/components/dashboard/weekly-goal";
import { CurrentStreak } from "@/components/dashboard/current-streak";
import { UpcomingEvent } from "@/components/dashboard/upcoming-event";
import { FriendsActivity } from "@/components/dashboard/friends-activity";
import { RecentRuns } from "@/components/dashboard/recent-runs";
import { AICoachCard } from "@/components/dashboard/ai-coach-card";
import { ChallengeProgress } from "@/components/dashboard/challenge-progress";
import { RunningStatsChart } from "@/components/dashboard/running-stats";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { NearbyRunningSummary } from "@/components/dashboard/nearby-running-summary";
import { Flame, TrendingUp, Users, Calendar } from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

export default function DashboardPage() {
  const profile = useAppStore((s) => s.profile);
  const { theme } = useTheme();
  const firstName = profile?.name?.split(" ")[0] || "Runner";
  const streak = profile?.current_streak || 0;

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative rounded-2xl overflow-hidden"
      >
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center" />
        <div className={`absolute inset-0 ${theme === 'light' ? 'bg-gradient-to-r from-white/60 via-white/40 to-white/20' : 'bg-gradient-to-r from-black/90 via-black/70 to-black/50'}`} />
        <div className="relative z-10 p-8 md:p-12">
          <div className="max-w-2xl">
            <div className="badge inline-flex items-center gap-2 mb-4">
              <Flame className="w-3 h-3" />
              {streak > 0 ? `${streak} Day Streak` : "Start Your Streak"}
            </div>
            <h1 className="display-heading text-4xl md:text-5xl lg:text-6xl mb-4">
              <span className={theme === 'light' ? 'text-gray-700' : 'text-white'}>{greeting}, </span><span className="text-gradient">{firstName}</span>
            </h1>
            <p className={`text-lg mb-6 max-w-lg ${theme === 'light' ? 'text-gray-600' : 'text-gray-300'}`}>
              {streak > 0
                ? "You're on fire! Keep the momentum going and crush your goals today."
                : "Ready to start your running journey? Every mile counts!"}
            </p>
            <div className="flex flex-wrap gap-4">
              {[
                { icon: TrendingUp, label: "Track Progress" },
                { icon: Users, label: "Join Club" },
                { icon: Calendar, label: "Find Events" },
              ].map((action, index) => (
                <motion.button
                  key={action.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className={`flex items-center gap-2 px-4 py-2 backdrop-blur-sm border rounded-xl text-sm font-medium transition-all ${theme === 'light' ? 'bg-white/70 border-gray-200 hover:bg-white/90 text-gray-800' : 'bg-secondary/50 border-border hover:bg-white/20'}`}
                >
                  <action.icon className="w-4 h-4" />
                  {action.label}
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats Row */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          { label: "Today's Goal", value: "5 km", icon: Flame },
          { label: "Weekly Goal", value: "35 km", icon: TrendingUp },
          { label: "Current Streak", value: `${streak} days`, icon: Flame },
          { label: "Total Runs", value: "127", icon: TrendingUp },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + index * 0.05 }}
            className="card p-6"
          >
            <stat.icon className="w-5 h-5 text-primary mb-3" />
            <div className="text-2xl font-bold text-foreground mb-1">{stat.value}</div>
            <div className="text-sm text-muted-foreground">{stat.label}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* Bento Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6"
      >
        {/* Row 1 — Key Stats */}
        <motion.div variants={itemVariants} className="sm:col-span-1 lg:col-span-2 xl:col-span-2">
          <TodayGoal />
        </motion.div>
        <motion.div variants={itemVariants} className="sm:col-span-1 lg:col-span-2 xl:col-span-2">
          <WeeklyGoal />
        </motion.div>
        <motion.div variants={itemVariants} className="sm:col-span-1 lg:col-span-1 xl:col-span-1">
          <CurrentStreak />
        </motion.div>

        {/* Row 2 — Charts & Events */}
        <motion.div variants={itemVariants} className="sm:col-span-2 lg:col-span-2 xl:col-span-3">
          <RunningStatsChart />
        </motion.div>
        <motion.div variants={itemVariants} className="sm:col-span-2 lg:col-span-2 xl:col-span-3">
          <RecentRuns />
        </motion.div>

        {/* Row 3 — Social & Challenges */}
        <motion.div variants={itemVariants} className="sm:col-span-1 lg:col-span-2 xl:col-span-2">
          <ChallengeProgress />
        </motion.div>
        <motion.div variants={itemVariants} className="sm:col-span-1 lg:col-span-1 xl:col-span-2">
          <UpcomingEvent />
        </motion.div>

        {/* Row 4 — AI Coach, Friends, Quick Actions, Nearby Running */}
        <motion.div variants={itemVariants} className="sm:col-span-2 lg:col-span-2 xl:col-span-3">
          <AICoachCard />
        </motion.div>
        <motion.div variants={itemVariants} className="sm:col-span-1 lg:col-span-1 xl:col-span-2">
          <FriendsActivity />
        </motion.div>
        <motion.div variants={itemVariants} className="sm:col-span-1 lg:col-span-1 xl:col-span-1">
          <QuickActions />
        </motion.div>

        {/* Row 5 — Nearby Running Summary */}
        <motion.div variants={itemVariants} className="sm:col-span-2 lg:col-span-2 xl:col-span-2">
          <NearbyRunningSummary />
        </motion.div>
      </motion.div>
    </div>
  );
}
