"use client";

import React, { useState } from "react";
import { BarChart3 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useFetch } from "@/hooks/use-fetch";
import { cn } from "@/lib/utils";
import type { RunningStats } from "@/types";

type TimeRange = "week" | "month";

export function RunningStatsChart() {
  const [range, setRange] = useState<TimeRange>("week");
  const { data: apiStats, error } = useFetch<RunningStats>("/api/stats");

  if (error) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 h-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <BarChart3 className="h-3.5 w-3.5" />
            Running Statistics
          </div>
        </div>
        <div className="mt-4 flex items-center justify-center h-full text-center">
          <p className="text-sm text-muted-foreground">Unable to load stats</p>
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

  const weeklyChartData = stats.weeklyData.map((d) => ({
    name: d.day,
    distance: +(d.distance / 1000).toFixed(1),
    duration: +(d.duration / 60).toFixed(0),
  }));

  const monthlyChartData = stats.monthlyData.map((d) => ({
    name: d.week,
    distance: +(d.distance / 1000).toFixed(1),
    duration: +(d.duration / 60).toFixed(0),
  }));

  const chartData = range === "week" ? weeklyChartData : monthlyChartData;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <BarChart3 className="h-3.5 w-3.5" />
          Running Statistics
        </div>
        <div className="flex rounded-lg bg-secondary p-0.5">
          {(["week", "month"] as TimeRange[]).map((t) => (
            <button
              key={t}
              onClick={() => setRange(t)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-all cursor-pointer",
                range === t
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t === "week" ? "This Week" : "This Month"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barSize={range === "week" ? 24 : 36}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              vertical={false}
            />
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              width={30}
              tickFormatter={(v: number) => `${v}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.75rem",
                fontSize: "0.75rem",
              }}
              formatter={(value) => [`${value} km`, "Distance"]}
              labelStyle={{ color: "hsl(var(--foreground))" }}
            />
            <Bar
              dataKey="distance"
              fill="hsl(var(--primary))"
              radius={[6, 6, 0, 0]}
              opacity={0.9}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3 border-t border-border pt-3">
        <div>
          <p className="text-[10px] text-muted-foreground">Total Distance</p>
          <p className="text-sm font-bold">
            {(stats.weeklyDistance / 1000).toFixed(1)} km
          </p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground">Avg Pace</p>
          <p className="text-sm font-bold">
            {stats.avgPace > 0
              ? `${Math.floor(stats.avgPace / 60)}:${(stats.avgPace % 60).toString().padStart(2, "0")} /km`
              : "—"}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground">Total Runs</p>
          <p className="text-sm font-bold">{stats.weeklyRuns}</p>
        </div>
      </div>
    </div>
  );
}
