"use client";

import React from "react";
import Link from "next/link";
import { Activity, ArrowRight, Heart, MessageCircle } from "lucide-react";
import { useFetch } from "@/hooks/use-fetch";
import { useAppStore } from "@/store/app-store";
import { formatDistance, formatDuration, formatPace, formatRelativeTime } from "@/lib/utils";
import type { Activity as ActivityT } from "@/types";

const typeEmoji: Record<string, string> = {
  run: "🏃",
  walk: "🚶",
  trail: "⛰️",
  treadmill: "🏋️",
};

export function RecentRuns() {
  const { data: apiActivities, error } = useFetch<ActivityT[]>("/api/activities");
  const profile = useAppStore((s) => s.profile);

  if (error) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 h-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <Activity className="h-3.5 w-3.5" />
            Recent Runs
          </div>
        </div>
        <div className="mt-3 flex items-center justify-center h-full text-center">
          <p className="text-sm text-muted-foreground">Unable to load activities</p>
        </div>
      </div>
    );
  }

  const activities = apiActivities || [];
  const recentActivities = activities
    .filter((a) => profile?.id ? a.userId === profile.id : false)
    .slice(0, 3);

  return (
    <div className="rounded-2xl border border-border bg-card p-5 h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <Activity className="h-3.5 w-3.5" />
          Recent Runs
        </div>
        <Link href="/activities" className="text-xs font-medium text-primary hover:underline">
          View all
        </Link>
      </div>

      <div className="mt-3 space-y-3">
        {recentActivities.map((activity) => (
          <div
            key={activity.id}
            className="rounded-xl border border-border/50 bg-secondary/30 p-3 transition-colors hover:bg-secondary/50"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{typeEmoji[activity.type]}</span>
                <div>
                  <h4 className="text-sm font-semibold">{activity.title}</h4>
                  <p className="text-[10px] text-muted-foreground">
                    {formatRelativeTime(activity.date)}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <div>
                <p className="text-xs text-muted-foreground">Distance</p>
                <p className="text-sm font-semibold">
                  {formatDistance(activity.distance)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Duration</p>
                <p className="text-sm font-semibold">
                  {formatDuration(activity.duration)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pace</p>
                <p className="text-sm font-semibold">
                  {formatPace(activity.pace)}
                </p>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Heart className="h-3 w-3" /> {activity.likes}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="h-3 w-3" /> {activity.comments}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
