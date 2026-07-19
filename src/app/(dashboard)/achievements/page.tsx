"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Award, Lock, Star, Sparkles } from "lucide-react";
import { useFetch } from "@/hooks/use-fetch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Achievement, AchievementRarity, AchievementCategory } from "@/types";

const rarityColors: Record<AchievementRarity, { border: string; bg: string; text: string; glow: string }> = {
  common: { border: "border-gray-300 dark:border-gray-600", bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-600 dark:text-gray-400", glow: "" },
  uncommon: { border: "border-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-600 dark:text-emerald-400", glow: "" },
  rare: { border: "border-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-600 dark:text-blue-400", glow: "shadow-blue-400/20" },
  epic: { border: "border-purple-400", bg: "bg-purple-50 dark:bg-purple-900/20", text: "text-purple-600 dark:text-purple-400", glow: "shadow-purple-400/20" },
  legendary: { border: "border-amber-400", bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-600 dark:text-amber-400", glow: "shadow-amber-400/30" },
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
};

export default function AchievementsPage() {
  const [filter, setFilter] = useState<string>("all");
  const { data: apiAchievements, loading, error } = useFetch<Achievement[]>("/api/achievements");

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Achievements</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track your milestones and earn badges
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <Award className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-lg font-medium">Unable to load achievements</p>
          <p className="text-sm text-muted-foreground mt-1">Please try again later</p>
        </div>
      </div>
    );
  }

  const achievements = apiAchievements || [];

  const unlocked = achievements.filter((a) => a.isUnlocked);
  const locked = achievements.filter((a) => !a.isUnlocked);
  const totalXP = unlocked.reduce((a, b) => a + b.xpReward, 0);

  const filteredAchievements = achievements.filter((a) => {
    if (filter === "all") return true;
    if (filter === "unlocked") return a.isUnlocked;
    if (filter === "locked") return !a.isUnlocked;
    return a.category === filter;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Achievements</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track your milestones and earn badges
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/10 to-card p-4 text-center">
          <Award className="mx-auto h-5 w-5 text-primary" />
          <p className="mt-2 text-2xl font-bold">{unlocked.length}</p>
          <p className="text-[10px] text-muted-foreground">Unlocked</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 text-center">
          <Lock className="mx-auto h-5 w-5 text-muted-foreground" />
          <p className="mt-2 text-2xl font-bold">{locked.length}</p>
          <p className="text-[10px] text-muted-foreground">Locked</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 text-center">
          <Star className="mx-auto h-5 w-5 text-warning" />
          <p className="mt-2 text-2xl font-bold">{totalXP.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground">XP Earned</p>
        </div>
        <div className="hidden sm:block rounded-2xl border border-border bg-card p-4 text-center">
          <Sparkles className="mx-auto h-5 w-5 text-accent" />
          <p className="mt-2 text-2xl font-bold">
            {Math.round((unlocked.length / achievements.length) * 100)}%
          </p>
          <p className="text-[10px] text-muted-foreground">Complete</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {[
          { value: "all", label: "All" },
          { value: "unlocked", label: "Unlocked" },
          { value: "locked", label: "Locked" },
          { value: "distance", label: "Distance" },
          { value: "speed", label: "Speed" },
          { value: "consistency", label: "Consistency" },
          { value: "social", label: "Social" },
          { value: "events", label: "Events" },
          { value: "special", label: "Special" },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-medium transition-all cursor-pointer",
              filter === f.value
                ? "bg-primary text-white shadow-md shadow-primary/25"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Achievements Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
      >
        {loading ? (
          Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-4 text-center">
              <Skeleton className="h-12 w-12 mx-auto mb-2" />
              <Skeleton className="h-4 w-3/4 mx-auto" />
              <Skeleton className="h-3 w-1/2 mx-auto mt-1" />
              <Skeleton className="h-6 w-16 mx-auto mt-2" />
            </div>
          ))
        ) : filteredAchievements.length === 0 ? (
          <div className="col-span-full py-16 text-center">
            <Award className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-lg font-medium">No achievements found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {filter === "unlocked" ? "Start running to unlock achievements!" : "Try a different filter"}
            </p>
          </div>
        ) : filteredAchievements.map((achievement) => {
          const rarity = rarityColors[achievement.rarity];
          const progress = Math.min(
            (achievement.progress / achievement.target) * 100,
            100
          );

          return (
            <motion.div key={achievement.id} variants={itemVariants}>
              <div
                className={cn(
                  "group relative overflow-hidden rounded-2xl border p-4 text-center transition-all duration-300 hover:-translate-y-0.5",
                  achievement.isUnlocked
                    ? cn(rarity.border, rarity.bg, "hover:shadow-lg", rarity.glow)
                    : "border-border bg-card opacity-60 hover:opacity-80 grayscale hover:grayscale-0"
                )}
              >
                {/* Icon */}
                <div className="relative mx-auto mb-2">
                  <span className="text-3xl sm:text-4xl">
                    {achievement.isUnlocked ? achievement.icon : "🔒"}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-xs font-semibold line-clamp-1">
                  {achievement.title}
                </h3>
                <p className="mt-0.5 text-[10px] text-muted-foreground line-clamp-2">
                  {achievement.description}
                </p>

                {/* Rarity */}
                <Badge className={cn("mt-2 text-[9px]", rarity.bg, rarity.text)}>
                  {achievement.rarity}
                </Badge>

                {/* Progress for locked */}
                {!achievement.isUnlocked && achievement.progress > 0 && (
                  <div className="mt-2">
                    <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary/60"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[9px] text-muted-foreground">
                      {achievement.progress}/{achievement.target}
                    </p>
                  </div>
                )}

                {/* XP */}
                <p className="mt-1 text-[10px] font-medium text-primary">
                  +{achievement.xpReward} XP
                </p>

                {achievement.isUnlocked && achievement.unlockedAt && (
                  <p className="mt-0.5 text-[9px] text-muted-foreground">
                    {new Date(achievement.unlockedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
