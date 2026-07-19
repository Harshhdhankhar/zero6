"use client";

import { useState } from "react";
import { useFetch } from "@/hooks/use-fetch";
import {
  Trophy, TrendingUp, Flame, Zap, Star,
  Loader2, AlertCircle, RefreshCw, User,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface LeaderboardEntry {
  rank: number; userId: string; name: string; username: string;
  avatar: string; value: number; unit: string; level: number; isCurrentUser: boolean;
}

const CATEGORIES = [
  { key: "distance", label: "Distance", icon: TrendingUp },
  { key: "runs", label: "Runs", icon: Flame },
  { key: "elevation", label: "Elevation", icon: Zap },
  { key: "streak", label: "Streak", icon: Trophy },
  { key: "xp", label: "XP", icon: Star },
] as const;

export function CommunityLeaderboard({ clubId }: { clubId: string }) {
  const [category, setCategory] = useState<string>("distance");
  const { data, loading, error, refetch } = useFetch<{ data: LeaderboardEntry[]; top3: LeaderboardEntry[]; meta: any }>(
    `/api/clubs/${clubId}/leaderboard?category=${category}`
  );
  const entries = data?.data || [];
  const top3 = data?.top3 || entries.slice(0, 3);

  const getUnitLabel = (unit: string) => {
    switch (unit) {
      case "km": return "km";
      case "runs": return "runs";
      case "days": return "day streak";
      case "xp": return "XP";
      case "min": return "min";
      default: return unit;
    }
  };

  if (loading) return <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>;

  if (error) return (
    <div className="flex flex-col items-center py-12 text-center">
      <AlertCircle className="h-8 w-8 text-red-400 mb-2" />
      <p className="text-sm text-white/60">Failed to load leaderboard</p>
      <Button variant="secondary" size="sm" onClick={refetch} className="mt-3 gap-2"><RefreshCw className="h-3 w-3" /> Retry</Button>
    </div>
  );

  if (entries.length === 0) return (
    <div className="flex flex-col items-center py-12 text-center">
      <Trophy className="h-10 w-10 text-white/20 mb-2" />
      <p className="text-sm text-white/40">No leaderboard data yet</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Category Pills */}
      <div className="flex flex-wrap gap-1.5">
        {CATEGORIES.map((cat) => {
          const CatIcon = cat.icon;
          return (
            <button key={cat.key} onClick={() => setCategory(cat.key)}
              className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium border transition-all cursor-pointer",
                category === cat.key ? "bg-primary/20 text-primary border-primary/30" : "bg-secondary/30 text-white/40 border-border hover:text-white/60")}>
              <CatIcon className="h-3 w-3" /> {cat.label}
            </button>
          );
        })}
      </div>

      {/* Podium */}
      {top3.length >= 3 && (
        <div className="flex items-end justify-center gap-3 py-6">
          {[2, 1, 3].map((pos) => {
            const entry = top3[pos - 1];
            if (!entry) return null;
            const height = pos === 1 ? "h-24" : pos === 2 ? "h-20" : "h-16";
            return (
              <motion.div key={pos} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: pos * 0.1 }}
                className="flex flex-col items-center gap-2">
                <div className="relative">
                  {entry.avatar ? (
                    <img src={entry.avatar} alt="" className={cn("w-12 h-12 rounded-xl object-cover ring-2",
                      pos === 1 ? "ring-yellow-400 w-14 h-14" : pos === 2 ? "ring-gray-300" : "ring-amber-600")} />
                  ) : (
                    <div className={cn("w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center ring-2",
                      pos === 1 ? "ring-yellow-400 w-14 h-14" : pos === 2 ? "ring-gray-300" : "ring-amber-600")}>
                      <User className="h-6 w-6 text-primary" />
                    </div>
                  )}
                  <div className={cn("absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold",
                    pos === 1 ? "bg-yellow-400 text-black" : pos === 2 ? "bg-gray-300 text-black" : "bg-amber-600 text-white")}>
                    {pos}
                  </div>
                </div>
                <p className={cn("text-xs font-semibold text-white text-center max-w-16 truncate", pos === 1 && "text-sm")}>
                  {entry.name?.split(" ")[0]}
                </p>
                <p className="text-[10px] text-white/60">{entry.value.toFixed(1)} {getUnitLabel(entry.unit)}</p>
                <div className={cn("w-16 rounded-lg", height, pos === 1 ? "bg-gradient-to-t from-yellow-500/30 to-yellow-500/10" : pos === 2 ? "bg-gradient-to-t from-gray-400/20 to-gray-400/10" : "bg-gradient-to-t from-amber-700/20 to-amber-700/10")} />
              </motion.div>
            );
          })}
        </div>
      )}

      {/* List */}
      <div className="space-y-1">
        {entries.slice(3).map((entry, i) => (
          <motion.div key={entry.userId} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
            className={cn("flex items-center gap-3 p-2.5 rounded-xl transition-all",
              entry.isCurrentUser ? "bg-primary/10 border border-primary/20" : "hover:bg-white/[0.03]")}>
            <span className="w-6 text-center text-xs font-bold text-white/30">{i + 4}</span>
            <Link href={`/profile/${entry.userId}`}>
              {entry.avatar ? (
                <img src={entry.avatar} alt="" className="w-8 h-8 rounded-lg object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-secondary/50 flex items-center justify-center"><User className="h-4 w-4 text-white/40" /></div>
              )}
            </Link>
            <div className="flex-1 min-w-0">
              <Link href={`/profile/${entry.userId}`}>
                <p className="text-xs font-medium text-white truncate hover:text-primary transition-colors">{entry.name}</p>
              </Link>
              <p className="text-[10px] text-white/30">Level {entry.level || 1}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-white">{entry.value.toFixed(1)}</p>
              <p className="text-[9px] text-white/30 uppercase">{getUnitLabel(entry.unit)}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
