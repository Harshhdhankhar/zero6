"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Trophy, ChevronUp, ChevronDown, Minus, Crown, Medal, Award } from "lucide-react";
import { useFetch } from "@/hooks/use-fetch";
import { useAppStore } from "@/store/app-store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type TimeFilter = "week" | "month" | "year" | "all";
type LeaderboardType = "distance" | "streak" | "pace" | "xp";

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<TimeFilter>("all");
  const [type, setType] = useState<LeaderboardType>("distance");
  const { data: apiLeaderboard, loading, error } = useFetch<any[]>(
    `/api/leaderboard?type=${type}&period=${period}`
  );

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Leaderboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            See how you stack up against the community
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <Trophy className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-lg font-medium">Unable to load leaderboard</p>
          <p className="text-sm text-muted-foreground mt-1">Please try again later</p>
        </div>
      </div>
    );
  }

  const leaderboardEntries = apiLeaderboard || [];

  const rankIcons = [
    <Crown key="1" className="h-5 w-5 text-amber-400" />,
    <Medal key="2" className="h-5 w-5 text-gray-400" />,
    <Award key="3" className="h-5 w-5 text-amber-700" />,
  ];

  const rankBgs = [
    "bg-gradient-to-r from-amber-500/10 to-amber-400/5 border-amber-400/30",
    "bg-gradient-to-r from-gray-300/10 to-gray-200/5 border-gray-300/30",
    "bg-gradient-to-r from-amber-700/10 to-amber-600/5 border-amber-700/30",
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Leaderboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          See how you stack up against the community
        </p>
      </div>

      {/* Type Tabs */}
      <div className="flex gap-1 rounded-xl bg-secondary/50 p-1">
        {(
          [
            { id: "distance", label: "Distance" },
            { id: "streak", label: "Streak" },
            { id: "duration", label: "Duration" },
            { id: "runs", label: "Runs" },
            { id: "elevation", label: "Elevation" },
            { id: "xp", label: "XP" },
          ] as { id: LeaderboardType; label: string }[]
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setType(tab.id)}
            className={cn(
              "relative flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all cursor-pointer",
              type === tab.id
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {type === tab.id && (
              <motion.div
                layoutId="leaderboard-tab"
                className="absolute inset-0 rounded-lg bg-background shadow-sm"
                transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Time Filter */}
      <div className="flex gap-2">
        {(
          [
            { id: "week", label: "This Week" },
            { id: "month", label: "This Month" },
            { id: "year", label: "This Year" },
            { id: "all", label: "All Time" },
          ] as { id: TimeFilter; label: string }[]
        ).map((f) => (
          <button
            key={f.id}
            onClick={() => setPeriod(f.id)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-medium transition-all cursor-pointer",
              period === f.id
                ? "bg-primary text-white shadow-md shadow-primary/25"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Your Position */}
      {leaderboardEntries.find((e) => e.isCurrentUser) && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <p className="text-xs font-medium text-primary mb-2">Your Position</p>
          {(() => {
            const myEntry = leaderboardEntries.find((e) => e.isCurrentUser)!;
            return (
              <div className="flex items-center gap-4">
                <span className="text-2xl font-bold text-primary">#{myEntry.rank}</span>
                <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                  <AvatarImage src={myEntry.avatar} />
                  <AvatarFallback>{myEntry.name.slice(0, 2)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{myEntry.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {myEntry.value} {myEntry.unit}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  {myEntry.change > 0 ? (
                    <span className="flex items-center gap-0.5 text-success font-medium">
                      <ChevronUp className="h-3.5 w-3.5" /> {myEntry.change}
                    </span>
                  ) : myEntry.change < 0 ? (
                    <span className="flex items-center gap-0.5 text-destructive font-medium">
                      <ChevronDown className="h-3.5 w-3.5" /> {Math.abs(myEntry.change)}
                    </span>
                  ) : (
                    <span className="flex items-center gap-0.5 text-muted-foreground">
                      <Minus className="h-3.5 w-3.5" />
                    </span>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Rankings List */}
      <div className="space-y-2">
        {loading ? (
          Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 rounded-xl border p-4">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-12" />
            </div>
          ))
        ) : leaderboardEntries.length === 0 ? (
          <div className="py-16 text-center">
            <Trophy className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-lg font-medium">No rankings yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Start running to appear on the leaderboard!
            </p>
          </div>
        ) : leaderboardEntries.map((entry, index) => (
          <motion.div
            key={entry.userId}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.04 }}
            className={cn(
              "flex items-center gap-4 rounded-xl border p-4 transition-all hover:shadow-md",
              entry.isCurrentUser
                ? "border-primary/30 bg-primary/5"
                : index < 3
                ? rankBgs[index]
                : "border-border bg-card"
            )}
          >
            {/* Rank */}
            <div className="flex h-8 w-8 items-center justify-center shrink-0">
              {index < 3 ? (
                rankIcons[index]
              ) : (
                <span className="text-sm font-bold text-muted-foreground">
                  {entry.rank}
                </span>
              )}
            </div>

            {/* User */}
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarImage src={entry.avatar} />
              <AvatarFallback>{entry.name.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className={cn("text-sm font-semibold truncate", entry.isCurrentUser && "text-primary")}>
                {entry.name}
                {entry.isCurrentUser && (
                  <span className="text-[10px] font-normal text-muted-foreground ml-1.5">
                    (You)
                  </span>
                )}
              </p>
            </div>

            {/* Value */}
            <div className="text-right shrink-0">
              <p className="text-sm font-bold">
                {entry.value} {entry.unit}
              </p>
            </div>

            {/* Change */}
            <div className="w-12 text-right shrink-0">
              {entry.change > 0 ? (
                <span className="flex items-center justify-end gap-0.5 text-xs font-medium text-success">
                  <ChevronUp className="h-3.5 w-3.5" /> {entry.change}
                </span>
              ) : entry.change < 0 ? (
                <span className="flex items-center justify-end gap-0.5 text-xs font-medium text-destructive">
                  <ChevronDown className="h-3.5 w-3.5" /> {Math.abs(entry.change)}
                </span>
              ) : (
                <span className="flex items-center justify-end text-xs text-muted-foreground">
                  <Minus className="h-3.5 w-3.5" />
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
