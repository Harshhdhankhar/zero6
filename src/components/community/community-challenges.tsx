"use client";

import { useState, useCallback } from "react";
import { useFetch } from "@/hooks/use-fetch";
import { useAuth } from "@/hooks/use-auth";
import {
  Trophy, Target, Flame, Clock, Users, Zap,
  Loader2, AlertCircle, RefreshCw, CheckCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Challenge {
  id: string; title: string; description: string;
  challengeType: string; goalValue: number; goalUnit: string;
  startDate: string; endDate: string; icon: string;
  difficulty: string; participantsCount: number;
  isActive: boolean; createdAt: string;
  createdBy: { id: string; name: string; avatar: string } | null;
  isJoined: boolean; progress: number; isCompleted: boolean;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  intermediate: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  advanced: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  elite: "text-red-400 bg-red-500/10 border-red-500/20",
};

export function CommunityChallenges({ clubId, isAdmin }: { clubId: string; isAdmin: boolean }) {
  const { isAuthenticated } = useAuth();
  const { data, loading, error, refetch } = useFetch<{ data: Challenge[]; meta: any }>(`/api/clubs/${clubId}/community?resource=challenges`);
  const challenges = data?.data || [];
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const handleJoin = useCallback(async (challengeId: string) => {
    if (!isAuthenticated) { toast.error("Sign in to join"); return; }
    setJoiningId(challengeId);
    try {
      const res = await fetch(`/api/clubs/${clubId}/community`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resource: "join_challenge", challengeId }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      toast.success("Joined challenge!");
      refetch();
    } catch (err: any) { toast.error(err.message); }
    finally { setJoiningId(null); }
  }, [clubId, isAuthenticated, refetch]);

  if (loading) return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>;

  if (error) return (
    <div className="flex flex-col items-center py-12 text-center">
      <AlertCircle className="h-8 w-8 text-red-400 mb-2" />
      <p className="text-sm text-white/60">Failed to load challenges</p>
      <Button variant="secondary" size="sm" onClick={refetch} className="mt-3 gap-2"><RefreshCw className="h-3 w-3" /> Retry</Button>
    </div>
  );

  if (challenges.length === 0) return (
    <div className="flex flex-col items-center py-12 text-center">
      <Trophy className="h-10 w-10 text-white/20 mb-2" />
      <p className="text-sm text-white/40">No active challenges</p>
    </div>
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {challenges.map((challenge, i) => {
        const endDate = new Date(challenge.endDate);
        const daysLeft = Math.ceil((endDate.getTime() - Date.now()) / 86400000);
        const progress = challenge.progress || 0;
        const goal = challenge.goalValue || 1;
        const pct = Math.min(100, Math.round((progress / goal) * 100));

        return (
          <motion.div key={challenge.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="rounded-2xl border border-border bg-white/[0.03] p-4 hover:border-border transition-all">
            <div className="flex items-start gap-3 mb-3">
              <div className="text-2xl">{challenge.icon || "🏃"}</div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-white">{challenge.title}</h3>
                {challenge.description && (
                  <p className="text-[11px] text-white/50 mt-0.5 line-clamp-2">{challenge.description}</p>
                )}
              </div>
              <Badge className={cn("text-[9px] px-1.5 py-0 rounded capitalize", DIFFICULTY_COLORS[challenge.difficulty] || "text-white/40 bg-secondary/30")}>
                {challenge.difficulty}
              </Badge>
            </div>

            <div className="flex items-center gap-3 mb-3 text-[10px] text-white/40">
              <span className="flex items-center gap-1"><Target className="h-3 w-3" /> {goal} {challenge.goalUnit}</span>
              <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {challenge.participantsCount || 0}</span>
              {daysLeft > 0 && <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {daysLeft}d left</span>}
            </div>

            {/* Progress Bar */}
            {challenge.isJoined && (
              <div className="mb-3">
                <div className="flex items-center justify-between text-[10px] mb-1">
                  <span className="text-white/60">{progress.toFixed(1)} / {goal} {challenge.goalUnit}</span>
                  <span className={cn("font-medium", challenge.isCompleted ? "text-emerald-400" : "text-primary")}>
                    {challenge.isCompleted ? "Completed!" : `${pct}%`}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-secondary/50 overflow-hidden">
                  <div className={cn("h-full rounded-full transition-all duration-500",
                    challenge.isCompleted ? "bg-emerald-500" : "bg-primary")}
                    style={{ width: `${Math.min(100, pct)}%` }} />
                </div>
              </div>
            )}

            <Button onClick={() => handleJoin(challenge.id)} disabled={joiningId === challenge.id || challenge.isJoined}
              className={cn("w-full h-8 text-xs rounded-xl gap-1.5",
                challenge.isJoined
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-primary hover:bg-primary/90 text-white")}>
              {joiningId === challenge.id ? <Loader2 className="h-3 w-3 animate-spin" /> :
               challenge.isJoined ? <CheckCircle className="h-3 w-3" /> : <Zap className="h-3 w-3" />}
              {challenge.isJoined ? "Joined" : "Join Challenge"}
            </Button>
          </motion.div>
        );
      })}
    </div>
  );
}
