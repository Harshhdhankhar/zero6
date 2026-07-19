"use client";

import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Trophy, Users, Clock, Flame, Mountain, Zap, Target } from "lucide-react";
import { useFetch } from "@/hooks/use-fetch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { CHALLENGE_DIFFICULTIES } from "@/lib/constants";
import type { Challenge } from "@/types";

const typeIcons: Record<string, React.ElementType> = {
  distance: Target,
  duration: Clock,
  frequency: Users,
  streak: Flame,
  elevation: Mountain,
  pace: Zap,
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function ChallengesPage() {
  const [filter, setFilter] = useState<string>("all");
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const { data: apiChallenges, loading, refetch } = useFetch<Challenge[]>("/api/challenges");

  const challenges = apiChallenges || [];

  const activeChallenges = challenges.filter((c) => c.isJoined && c.current < c.target);
  const completedChallenges = challenges.filter((c) => c.isJoined && c.current >= c.target);
  const availableChallenges = challenges.filter((c) => !c.isJoined);

  const filteredChallenges = challenges.filter((c) => {
    if (filter === "all") return true;
    if (filter === "joined") return c.isJoined;
    if (filter === "available") return !c.isJoined;
    if (filter === "completed") return c.isJoined && c.current >= c.target;
    return c.difficulty === filter;
  });

  const handleJoinChallenge = useCallback(async (challengeId: string) => {
    setJoiningId(challengeId);
    try {
      const res = await fetch("/api/challenges/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId }),
      });
      if (res.ok) {
        refetch();
      }
    } catch (error) {
    } finally {
      setJoiningId(null);
    }
  }, [refetch]);

  const getProgressLabel = (challenge: Challenge) => {
    if (challenge.type === "pace") {
      const paceMin = Math.floor(challenge.current / 60);
      const paceSec = challenge.current % 60;
      const targetMin = Math.floor(challenge.target / 60);
      const targetSec = challenge.target % 60;
      return `${paceMin}:${paceSec.toString().padStart(2, "0")} / ${targetMin}:${targetSec.toString().padStart(2, "0")} /km`;
    }
    if (challenge.unit === "meters") {
      return `${(challenge.current / 1000).toFixed(1)} / ${(challenge.target / 1000).toFixed(0)} km`;
    }
    if (challenge.unit === "seconds") {
      return `${Math.floor(challenge.current / 60)} / ${Math.floor(challenge.target / 60)} min`;
    }
    return `${challenge.current} / ${challenge.target} ${challenge.unit}`;
  };

  const renderChallengeCard = (challenge: Challenge) => {
    const Icon = typeIcons[challenge.type] || Target;
    const progress = Math.min((challenge.current / challenge.target) * 100, 100);
    const isCompleted = challenge.current >= challenge.target;
    const difficulty = CHALLENGE_DIFFICULTIES.find(
      (d) => d.value === challenge.difficulty
    );
    const daysLeft = Math.max(
      0,
      Math.ceil(
        (new Date(challenge.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
    );

    return (
      <motion.div key={challenge.id} variants={itemVariants}>
        <div
          className={cn(
            "card card-interactive p-6",
            isCompleted ? "border-green-500/30" : ""
          )}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="text-4xl">{challenge.icon}</div>
              <div>
                <h3 className="heading-md text-lg">{challenge.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    className={cn(
                      "text-xs",
                      difficulty?.bgColor,
                      difficulty?.color
                    )}
                  >
                    {difficulty?.label}
                  </Badge>
                  {isCompleted && (
                    <Badge className="bg-green-500/20 text-green-400 text-xs border border-green-500/30">
                      ✓ Complete
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          <p className="text-sm text-muted line-clamp-2 mb-6">
            {challenge.description}
          </p>

          {challenge.isJoined && (
            <div className="mb-6">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted">
                  {getProgressLabel(challenge)}
                </span>
                <span className="font-bold">{Math.round(progress)}%</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-secondary/50">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={cn(
                    "h-full rounded-full",
                    isCompleted
                      ? "bg-gradient-to-r from-green-500 to-emerald-400"
                      : "bg-gradient-to-r from-primary to-orange-400"
                  )}
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4 text-sm text-muted">
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" /> {challenge.participantCount.toLocaleString()}
              </span>
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" /> {daysLeft}d left
              </span>
            </div>
            <span className="text-sm font-bold text-primary">
              +{challenge.rewardXP} XP
            </span>
          </div>

          <Button
            size="sm"
            variant={challenge.isJoined ? "secondary" : "default"}
            className="w-full rounded-xl text-sm"
            disabled={joiningId === challenge.id}
            onClick={() => !challenge.isJoined && !isCompleted && handleJoinChallenge(challenge.id)}
          >
            {joiningId === challenge.id
              ? "Joining..."
              : isCompleted
              ? "Claim Reward"
              : challenge.isJoined
              ? "View Progress"
              : "Join Challenge"}
          </Button>
        </div>
      </motion.div>
    );
  };

  const renderSection = (title: string, items: Challenge[], emptyMsg: string) => {
    if (items.length === 0 && filter === "all") return null;
    return (
      <section>
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {items.length > 0
            ? items.map(renderChallengeCard)
            : filter !== "all" && (
                <div className="col-span-full py-8 text-center text-muted-foreground">
                  {emptyMsg}
                </div>
              )}
        </motion.div>
      </section>
    );
  };

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative rounded-2xl overflow-hidden"
      >
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/50" />
        <div className="relative z-10 p-8 md:p-12">
          <div className="max-w-2xl">
            <div className="badge inline-flex items-center gap-2 mb-4">
              <Trophy className="w-3 h-3" />
              Challenges
            </div>
            <h1 className="display-heading text-4xl md:text-5xl lg:text-6xl mb-4">
              Push Your <span className="text-gradient">Limits</span>
            </h1>
            <p className="text-lg text-gray-300 mb-6 max-w-lg">
              Take on challenges, earn XP, and prove your dedication. Every milestone brings you closer to greatness.
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          { icon: Trophy, label: "Active", value: activeChallenges.length },
          { icon: Target, label: "Completed", value: completedChallenges.length },
          { icon: Zap, label: "XP Available", value: challenges.filter((c) => c.isJoined).reduce((a, c) => a + c.rewardXP, 0).toLocaleString() },
          { icon: Users, label: "Participants", value: challenges.reduce((a, c) => a + c.participantCount, 0).toLocaleString() },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 + index * 0.05 }}
            className="card p-6 text-center"
          >
            <stat.icon className="mx-auto h-6 w-6 text-primary mb-3" />
            <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
            <p className="text-sm text-muted">{stat.label}</p>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
        className="flex flex-wrap gap-3"
      >
        {[
          { value: "all", label: "All Challenges" },
          { value: "joined", label: "My Challenges" },
          { value: "available", label: "Available" },
          { value: "completed", label: "Completed" },
          { value: "beginner", label: "Beginner" },
          { value: "intermediate", label: "Intermediate" },
          { value: "advanced", label: "Advanced" },
          { value: "elite", label: "Elite" },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer",
              filter === f.value
                ? "bg-primary text-white shadow-lg shadow-primary/30"
                : "bg-secondary/30 border border-border text-gray-300 hover:bg-secondary hover:text-foreground"
            )}
          >
            {f.label}
          </button>
        ))}
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-6">
              <Skeleton className="h-6 w-3/4 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3 mb-6" />
              <Skeleton className="h-3 w-full mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      ) : filter === "all" ? (
        <>
          {renderSection("Active Challenges", activeChallenges, "No active challenges")}
          {renderSection("Completed", completedChallenges, "No completed challenges")}
          {renderSection("Available Challenges", availableChallenges, "No available challenges")}
        </>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredChallenges.length > 0
            ? filteredChallenges.map(renderChallengeCard)
            : (
                <div className="col-span-full py-16 text-center">
                  <Trophy className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-lg font-medium">No challenges found</p>
                  <p className="text-sm text-muted-foreground mt-1">Try a different filter</p>
                </div>
              )}
        </motion.div>
      )}
    </div>
  );
}
