"use client";

import React from "react";
import { Calendar, TrendingUp } from "lucide-react";
import { useFetch } from "@/hooks/use-fetch";
import type { RunningStats } from "@/types";

export function WeeklyGoal() {
  const { data: apiStats, error } = useFetch<RunningStats>("/api/stats");

  if (error) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 h-full">
        <div className="flex items-center justify-center h-full text-center">
          <div>
            <p className="text-sm text-muted-foreground">Unable to load stats</p>
            <p className="text-xs text-muted-foreground mt-1">Please try again later</p>
          </div>
        </div>
      </div>
    );
  }

  const defaultStats = {
    weeklyDistance: 0,
    weeklyRuns: 0,
    weeklyDuration: 0,
    monthlyDistance: 0,
    avgPace: 0,
    bestPace: 0,
    weeklyData: [
      { day: "Mon", distance: 0, duration: 0, runs: 0 },
      { day: "Tue", distance: 0, duration: 0, runs: 0 },
      { day: "Wed", distance: 0, duration: 0, runs: 0 },
      { day: "Thu", distance: 0, duration: 0, runs: 0 },
      { day: "Fri", distance: 0, duration: 0, runs: 0 },
      { day: "Sat", distance: 0, duration: 0, runs: 0 },
      { day: "Sun", distance: 0, duration: 0, runs: 0 },
    ],
    monthlyData: [
      { week: "W1", distance: 0, duration: 0, runs: 0 },
      { week: "W2", distance: 0, duration: 0, runs: 0 },
      { week: "W3", distance: 0, duration: 0, runs: 0 },
      { week: "W4", distance: 0, duration: 0, runs: 0 },
    ],
  };
  const stats = apiStats || defaultStats;
  const weeklyTarget = 60000;
  const progress = Math.min((stats.weeklyDistance / weeklyTarget) * 100, 100);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 h-full">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            Weekly Progress
          </div>
          <p className="mt-2 text-3xl font-bold tracking-tight">
            {(stats.weeklyDistance / 1000).toFixed(1)}
            <span className="text-lg text-muted-foreground"> / {weeklyTarget / 1000} km</span>
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-accent/10 px-2 py-1 text-xs font-semibold text-accent">
          <TrendingUp className="h-3 w-3" />
          {stats.weeklyRuns} runs
        </div>
      </div>

      <div className="mt-4 flex items-end gap-1 h-12">
        {stats.weeklyData.map((day) => {
          const maxDist = Math.max(...stats.weeklyData.map((d) => d.distance), 1);
          const height = (day.distance / maxDist) * 100;

          return (
            <div key={day.day} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-t transition-all duration-500"
                style={{
                  height: `${Math.max(height, 4)}%`,
                  background:
                    day.distance > 0
                      ? "linear-gradient(to top, hsl(var(--primary)), hsl(var(--accent)))"
                      : "hsl(var(--muted))",
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-1 flex gap-1">
        {stats.weeklyData.map((day) => (
          <div key={day.day} className="flex-1 text-center text-[10px] text-muted-foreground">
            {day.day}
          </div>
        ))}
      </div>

      <div className="absolute -right-6 -bottom-6 h-24 w-24 rounded-full bg-accent/5 blur-2xl" />
    </div>
  );
}
