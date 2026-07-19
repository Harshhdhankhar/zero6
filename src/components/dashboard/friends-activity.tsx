"use client";

import React from "react";
import Link from "next/link";
import { Users } from "lucide-react";
import { useFetch } from "@/hooks/use-fetch";
import { useAppStore } from "@/store/app-store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistance, formatRelativeTime } from "@/lib/utils";
import type { Activity } from "@/types";

export function FriendsActivity() {
  const { data: apiActivities, error } = useFetch<Activity[]>("/api/activities");
  const profile = useAppStore((s) => s.profile);

  if (error) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 h-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            Friends Activity
          </div>
        </div>
        <div className="mt-3 flex items-center justify-center h-full text-center">
          <p className="text-sm text-muted-foreground">Unable to load activities</p>
        </div>
      </div>
    );
  }

  const activities = apiActivities || [];
  const friendActivities = activities
    .filter((a) => profile?.id ? a.userId !== profile.id : false)
    .slice(0, 4);

  return (
    <div className="rounded-2xl border border-border bg-card p-5 h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          Friends Activity
        </div>
        <Link href="/explore" className="text-xs font-medium text-primary hover:underline">
          See all
        </Link>
      </div>

      <div className="mt-3 space-y-3">
        {friendActivities.map((activity) => (
          <div key={activity.id} className="flex items-center gap-3">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src={activity.userAvatar} alt={activity.userName} />
              <AvatarFallback>
                {activity.userName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{activity.userName}</p>
              <p className="text-xs text-muted-foreground truncate">
                {activity.title} · {formatDistance(activity.distance)}
              </p>
            </div>
            <span className="shrink-0 text-[10px] text-muted-foreground">
              {formatRelativeTime(activity.date)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
