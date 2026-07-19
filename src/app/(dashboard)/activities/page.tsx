"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Activity, Heart, Plus, MapPin, Clock, Flame } from "lucide-react";
import { useFetch } from "@/hooks/use-fetch";
import { useAppStore } from "@/store/app-store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ActivityLogDialog } from "@/components/shared/activity-log-dialog";
import { ActivityComments } from "@/components/shared/activity-comments";
import { cn, formatDistance, formatDuration, formatPace, formatRelativeTime } from "@/lib/utils";
import type { Activity as ActivityT, ActivityType } from "@/types";

const typeEmoji: Record<ActivityType, string> = {
  run: "🏃",
  walk: "🚶",
  trail: "⛰️",
  treadmill: "🏋️",
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function ActivitiesPage() {
  const [filter, setFilter] = useState<string>("all");
  const [isLogDialogOpen, setIsLogDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [likingId, setLikingId] = useState<string | null>(null);
  const itemsPerPage = 10;
  const { data: apiActivities, loading } = useFetch<ActivityT[]>("/api/activities");
  const profile = useAppStore((s) => s.profile);

  const activities = apiActivities || [];

  const filtered = activities.filter((a) => {
    if (filter === "all") return true;
    if (filter === "mine") return a.userId === profile?.id;
    return a.type === filter;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  const handleLike = async (activityId: string, currentLiked: boolean) => {
    setLikingId(activityId);
    try {
      const res = await fetch(`/api/activities/${activityId}/like`, {
        method: currentLiked ? "DELETE" : "POST",
      });
      if (res.ok) {
        const activity = activities.find(a => a.id === activityId);
        if (activity) {
          activity.isLiked = !currentLiked;
          activity.likes += currentLiked ? -1 : 1;
        }
      }
    } catch (error) {
    } finally {
      setLikingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
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
              <Activity className="w-3 h-3" />
              Activity Feed
            </div>
            <h1 className="display-heading text-4xl md:text-5xl lg:text-6xl mb-4">
              Your <span className="text-gradient">Running Journey</span>
            </h1>
            <p className="text-lg text-gray-300 mb-6 max-w-lg">
              Track every mile, celebrate every achievement, and share your progress with the community.
            </p>
            <Button
              onClick={() => setIsLogDialogOpen(true)}
              className="btn-primary gap-2"
            >
              <Plus className="h-4 w-4" /> Log Activity
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex flex-wrap gap-3"
      >
        {[
          { value: "all", label: "All Activities" },
          { value: "mine", label: "My Activities" },
          { value: "run", label: "🏃 Runs" },
          { value: "trail", label: "⛰️ Trail" },
          { value: "treadmill", label: "🏋️ Treadmill" },
          { value: "walk", label: "🚶 Walk" },
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

      {/* Activity Feed */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-6">
              <Skeleton className="h-48 w-full rounded-xl mb-4" />
              <div className="flex items-start gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-20 text-center">
            <Activity className="mx-auto h-16 w-16 text-muted mb-4" />
            <p className="text-xl font-semibold mb-2">No activities found</p>
            <p className="text-muted">
              {filter === "mine" ? "Log your first activity to get started!" : "Try adjusting your filters"}
            </p>
          </div>
        ) : paginated.map((activity) => (
          <motion.div key={activity.id} variants={itemVariants}>
            <div className="card card-interactive overflow-hidden">
              {/* Activity Image */}
              <div className="relative h-48 bg-gradient-to-br from-primary/20 to-orange-500/10">
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-6xl">{typeEmoji[activity.type]}</span>
                </div>
                <div className="absolute top-4 right-4">
                  <Badge className="bg-black/50 backdrop-blur-sm border border-border">
                    {activity.type}
                  </Badge>
                </div>
              </div>

              <div className="p-6">
                {/* Header */}
                <div className="flex items-start gap-3 mb-4">
                  <Avatar className="h-12 w-12 shrink-0">
                    <AvatarImage src={activity.userAvatar} alt={activity.userName} />
                    <AvatarFallback>{activity.userName.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base">{activity.userName}</h3>
                    <p className="text-xs text-muted flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatRelativeTime(activity.date)}
                    </p>
                  </div>
                </div>

                {/* Title */}
                <h4 className="heading-md text-lg mb-2">{activity.title}</h4>
                <p className="text-sm text-muted line-clamp-2 mb-4">
                  {activity.description}
                </p>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[
                    { label: "Distance", value: formatDistance(activity.distance), icon: MapPin },
                    { label: "Duration", value: formatDuration(activity.duration), icon: Clock },
                    { label: "Pace", value: formatPace(activity.pace), icon: Flame },
                    { label: "Calories", value: `${activity.calories}`, icon: Flame },
                  ].map((s) => (
                    <div key={s.label} className="bg-secondary/30 rounded-xl p-3">
                      <s.icon className="w-4 h-4 text-primary mb-1" />
                      <p className="text-xs text-muted">{s.label}</p>
                      <p className="text-sm font-bold">{s.value}</p>
                    </div>
                  ))}
                </div>

                {/* HR + Cadence */}
                <div className="flex gap-4 text-xs text-muted mb-4">
                  <span>❤️ Avg {activity.heartRateAvg} · Max {activity.heartRateMax} bpm</span>
                  <span>👟 {activity.cadenceAvg} spm</span>
                </div>

                {/* Social */}
                <div className="flex items-center gap-4 pt-4 border-t border-border">
                  <button
                    disabled={likingId === activity.id}
                    onClick={() => handleLike(activity.id, activity.isLiked)}
                    className={cn(
                      "flex items-center gap-2 text-sm font-medium transition-colors cursor-pointer",
                      activity.isLiked ? "text-red-500" : "text-muted hover:text-red-500"
                    )}>
                    <Heart className={cn("h-5 w-5", activity.isLiked && "fill-current")} />
                    {likingId === activity.id ? "..." : activity.likes}
                  </button>
                  <ActivityComments activityId={activity.id} commentCount={activity.comments} />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="rounded-xl"
          >
            Previous
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={cn(
                  "w-10 h-10 rounded-xl text-sm font-medium transition-colors cursor-pointer",
                  currentPage === page
                    ? "bg-primary text-white"
                    : "bg-secondary/30 text-muted hover:bg-secondary hover:text-foreground"
                )}
              >
                {page}
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="rounded-xl"
          >
            Next
          </Button>
        </div>
      )}

      <ActivityLogDialog open={isLogDialogOpen} onOpenChange={setIsLogDialogOpen} />
    </div>
  );
}
