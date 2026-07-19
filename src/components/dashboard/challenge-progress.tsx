"use client";

import React from "react";
import Link from "next/link";
import { Trophy, Clock } from "lucide-react";
import { useFetch } from "@/hooks/use-fetch";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { ActiveChallenge } from "@/types";

function getDaysRemaining(endDate: string): number {
  return Math.max(
    0,
    Math.ceil(
      (new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
  );
}

export function ChallengeProgress() {
  const { data: activeData, loading, error } = useFetch<ActiveChallenge[]>("/api/challenges/active");
  const challenges = activeData || [];

  if (error) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 h-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <Trophy className="h-3.5 w-3.5" />
            Active Challenges
          </div>
        </div>
        <div className="mt-3 flex items-center justify-center h-full text-center">
          <p className="text-sm text-muted-foreground">Unable to load challenges</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 h-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <Trophy className="h-3.5 w-3.5" />
            Active Challenges
          </div>
        </div>
        <div className="mt-3 space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-1.5 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!challenges.length) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 h-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <Trophy className="h-3.5 w-3.5" />
            Active Challenges
          </div>
          <Link href="/challenges" className="text-xs font-medium text-primary hover:underline">
            View All
          </Link>
        </div>
        <div className="mt-6 flex flex-col items-center justify-center text-center">
          <Trophy className="h-8 w-8 text-muted-foreground/40" />
          <p className="mt-2 text-sm text-muted-foreground">No active challenges</p>
          <Link
            href="/challenges"
            className="mt-2 text-xs font-medium text-primary hover:underline"
          >
            Browse challenges
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <Trophy className="h-3.5 w-3.5" />
          Active Challenges
        </div>
        <Link href="/challenges" className="text-xs font-medium text-primary hover:underline">
          View All
        </Link>
      </div>

      <div className="mt-3 space-y-3">
        {challenges.slice(0, 3).map((challenge) => {
          const progress = Math.min(
            (challenge.progress / challenge.goalValue) * 100,
            100
          );
          const daysLeft = getDaysRemaining(challenge.endDate);

          return (
            <div key={challenge.id} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base shrink-0">{challenge.icon}</span>
                  <span className="text-xs font-medium truncate">
                    {challenge.title}
                  </span>
                </div>
                <span className="text-xs font-semibold text-primary shrink-0 ml-2">
                  {Math.round(progress)}%
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-700",
                    progress >= 90
                      ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                      : progress >= 50
                      ? "bg-gradient-to-r from-primary to-accent"
                      : "bg-primary/60"
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>
                  {challenge.progress} / {challenge.goalValue} {challenge.goalUnit}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {daysLeft}d left
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
