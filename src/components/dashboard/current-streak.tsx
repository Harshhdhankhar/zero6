"use client";

import React from "react";
import { Flame } from "lucide-react";
import { useAppStore } from "@/store/app-store";

export function CurrentStreak() {
  const user = useAppStore((s) => s.profile);
  const streak = user?.current_streak || 0;
  const longestStreak = user?.longest_streak || 1;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-orange-500/10 via-card to-red-500/5 p-5 h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <Flame className="h-3.5 w-3.5 text-orange-500" />
          Streak
        </div>
        <p className="mt-2 text-4xl font-bold tracking-tight text-orange-500">
          {streak}
        </p>
        <p className="text-xs text-muted-foreground">consecutive days</p>
      </div>

      <div className="mt-3">
        <p className="text-[10px] text-muted-foreground">
          Personal best: {longestStreak} days
        </p>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-orange-500 to-red-500"
            style={{
              width: `${Math.min((streak / longestStreak) * 100, 100)}%`,
            }}
          />
        </div>
      </div>

      {/* Fire emoji decoration */}
      <div className="absolute -right-2 -top-2 text-4xl opacity-10">🔥</div>
    </div>
  );
}
