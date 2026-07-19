"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Calendar, Users, Trophy, Activity, Play } from "lucide-react";
import { ActivityLogDialog } from "@/components/shared/activity-log-dialog";
import { useRunTrackingContext } from "@/components/run/run-tracking-provider";

const actions = [
  { icon: Activity, label: "Log Run", key: "log-run", color: "text-primary", bg: "bg-primary/10" },
  { icon: Play, label: "Start Run", key: "start-run", color: "text-primary", bg: "bg-primary/10" },
  { icon: Calendar, label: "Events", href: "/events", color: "text-accent", bg: "bg-accent/10" },
  { icon: Users, label: "Clubs", href: "/clubs", color: "text-success", bg: "bg-success/10" },
  { icon: Trophy, label: "Challenges", href: "/challenges", color: "text-warning", bg: "bg-warning/10" },
];

export function QuickActions() {
  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const { startRun } = useRunTrackingContext();

  return (
    <div className="rounded-2xl border border-border bg-card p-5 h-full flex flex-col">
      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Quick Actions
      </div>

      <div className="mt-3 flex-1 grid grid-cols-2 gap-2">
        {actions.map((action) => {
          const Icon = action.icon;
          if (action.key === "log-run") {
            return (
              <button
                key={action.label}
                onClick={() => setLogDialogOpen(true)}
                className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-border/50 bg-secondary/30 p-3 transition-all hover:bg-secondary/60 hover:scale-[1.02] cursor-pointer"
              >
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${action.bg}`}>
                  <Icon className={`h-4 w-4 ${action.color}`} />
                </div>
                <span className="text-[10px] font-medium">{action.label}</span>
              </button>
            );
          }
          if (action.key === "start-run") {
            return (
              <button
                key={action.label}
                onClick={() => startRun()}
                className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-border/50 bg-secondary/30 p-3 transition-all hover:bg-secondary/60 hover:scale-[1.02] cursor-pointer"
              >
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${action.bg}`}>
                  <Icon className={`h-4 w-4 ${action.color}`} />
                </div>
                <span className="text-[10px] font-medium">{action.label}</span>
              </button>
            );
          }
          return (
            <Link
              key={action.label}
              href={action.href!}
              className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-border/50 bg-secondary/30 p-3 transition-all hover:bg-secondary/60 hover:scale-[1.02]"
            >
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${action.bg}`}>
                <Icon className={`h-4 w-4 ${action.color}`} />
              </div>
              <span className="text-[10px] font-medium">{action.label}</span>
            </Link>
          );
        })}
      </div>

      <ActivityLogDialog open={logDialogOpen} onOpenChange={setLogDialogOpen} />
    </div>
  );
}
