"use client";

import React from "react";
import { Target, TrendingUp } from "lucide-react";
import { useFetch } from "@/hooks/use-fetch";

interface StatsData {
  todayDistance: number;
  dailyTarget: number;
}

export function TodayGoal() {
  const { data: stats, error } = useFetch<StatsData>("/api/stats");

  if (error) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 h-full">
        <div className="flex items-center justify-center h-full text-center">
          <div>
            <p className="text-sm text-muted-foreground">Unable to load stats</p>
            <p className="text-xs text-muted-foreground mt-1">Please try again later</p>
          </div>
        </div>
      </div>
    );
  }

  const dailyTarget = stats?.dailyTarget || 8000;
  const todayDistance = stats?.todayDistance || 0;
  const progress = Math.min((todayDistance / dailyTarget) * 100, 100);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 h-full">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <Target className="h-3.5 w-3.5" />
            Today&apos;s Goal
          </div>
          <p className="mt-2 text-3xl font-bold tracking-tight">
            {(todayDistance / 1000).toFixed(1)}
            <span className="text-lg text-muted-foreground"> / {dailyTarget / 1000} km</span>
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-success/10 px-2 py-1 text-xs font-semibold text-success">
          <TrendingUp className="h-3 w-3" />
          {Math.round(progress)}%
        </div>
      </div>

      <div className="mt-4">
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-1000 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {todayDistance >= dailyTarget
            ? "Daily target reached! 🎉"
            : `${((dailyTarget - todayDistance) / 1000).toFixed(1)} km remaining to hit your daily target`}
        </p>
      </div>

      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/5 blur-2xl" />
    </div>
  );
}
