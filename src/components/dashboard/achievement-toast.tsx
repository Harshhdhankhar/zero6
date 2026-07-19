"use client";

import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Award } from "lucide-react";
import { useFetch } from "@/hooks/use-fetch";
import { useAppStore } from "@/store/app-store";
import type { RecentAchievement } from "@/types";

export function AchievementToast() {
  const profile = useAppStore((s) => s.profile);
  const userId = profile?.id;
  const { data: achievements } = useFetch<RecentAchievement[]>(
    userId ? "/api/achievements/recent" : ""
  );
  const [visible, setVisible] = React.useState(true);
  const seenRef = useRef<Set<string>>(new Set());

  const recent = (achievements || []).filter(
    (a) => !seenRef.current.has(a.id)
  );

  useEffect(() => {
    if (recent.length > 0) {
      recent.forEach((a) => seenRef.current.add(a.id));
      setVisible(true);
    }
  }, [achievements]);

  if (!recent.length) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ x: 320, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 320, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
          className="fixed bottom-4 right-4 z-50 flex flex-col gap-2"
        >
          {recent.map((achievement) => (
            <div
              key={achievement.id}
              className="pointer-events-auto flex items-center gap-3 rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-orange-500/10 p-4 shadow-lg backdrop-blur-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20 text-xl">
                {achievement.icon || <Award className="h-5 w-5 text-amber-400" />}
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                  Achievement Unlocked!
                </p>
                <p className="text-sm font-medium text-foreground">
                  {achievement.title}
                </p>
              </div>
              <button
                onClick={() => setVisible(false)}
                className="shrink-0 rounded-md p-1 text-muted-foreground hover:text-foreground"
                aria-label="Dismiss"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
