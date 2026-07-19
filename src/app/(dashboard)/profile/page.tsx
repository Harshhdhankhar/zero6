"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  MapPin,
  Calendar,
  Users,
  Activity,
  Flame,
  Award,
  Share2,
  Edit,
  Heart,
  MessageCircle,
} from "lucide-react";
import { useFetch } from "@/hooks/use-fetch";
import { useAppStore } from "@/store/app-store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProfileEditDialog } from "@/components/shared/profile-edit-dialog";
import {
  formatDistance,
  formatDuration,
  formatPace,
  formatRelativeTime,
  formatDate,
} from "@/lib/utils";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { Activity as ActivityT, Achievement } from "@/types";

type ProfileTab = "activities" | "achievements" | "stats";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<ProfileTab>("activities");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const user = useAppStore((s) => s.profile);
  const { data: apiActivities } = useFetch<ActivityT[]>(
    user ? `/api/activities?userId=${user.id}` : ""
  );
  const { data: apiAchievements } = useFetch<Achievement[]>("/api/achievements");
  const userActivities = apiActivities || [];
  const allAchievements = apiAchievements || [];
  const unlockedAchievements = allAchievements.filter((a) => a.isUnlocked);

  const tabs: { id: ProfileTab; label: string }[] = [
    { id: "activities", label: "Activities" },
    { id: "achievements", label: "Achievements" },
    { id: "stats", label: "Stats" },
  ];

  if (!user) return null;

  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="card overflow-hidden"
      >
        {/* Cover */}
        <div className="relative h-48 sm:h-56 bg-gradient-to-br from-primary/30 via-orange-500/20 to-primary/10">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center opacity-30" />
        </div>

        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-16 sm:-mt-14">
            <Avatar className="h-28 w-28 ring-4 ring-[#0A0A0F] shrink-0">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="text-2xl font-bold">
                {user.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="heading-md text-2xl font-bold">{user.name}</h1>
                <Badge className="bg-primary text-white text-xs">Level {user.level}</Badge>
                <Badge className="bg-secondary/50 text-white text-xs border border-border">
                  {user.role}
                </Badge>
              </div>
              <p className="text-sm text-muted">@{user.username}</p>
            </div>

            <div className="flex gap-3 shrink-0">
              <Button onClick={() => setIsEditDialogOpen(true)} variant="outline" size="sm" className="rounded-xl gap-2">
                <Edit className="h-4 w-4" /> Edit Profile
              </Button>
              <Button variant="outline" size="sm" className="rounded-xl">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <p className="mt-4 text-sm text-muted line-clamp-2">{user.bio}</p>

          <div className="mt-4 flex flex-wrap items-center gap-6 text-sm text-muted">
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" /> {user.location}
            </span>
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" /> Joined {formatDate(user.created_at)}
            </span>
          </div>

          {/* Social Stats */}
          <div className="mt-6 flex gap-8">
            <div className="text-center">
              <p className="text-2xl font-bold">{user.followers_count.toLocaleString()}</p>
              <p className="text-xs text-muted">Followers</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{user.following_count.toLocaleString()}</p>
              <p className="text-xs text-muted">Following</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{user.total_runs}</p>
              <p className="text-xs text-muted">Runs</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          { icon: Activity, label: "Total Distance", value: formatDistance(user.total_distance) },
          { icon: Flame, label: "Current Streak", value: `${user.current_streak} days` },
          { icon: Award, label: "Achievements", value: unlockedAchievements.length.toString() },
          { icon: Users, label: "Total Time", value: formatDuration(user.total_duration) },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 + index * 0.05 }}
            className="card p-6 text-center"
          >
            <stat.icon className="mx-auto h-6 w-6 text-primary mb-3" />
            <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
            <p className="text-xs text-muted">{stat.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* XP Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="glass-strong p-6 rounded-2xl"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="heading-md text-lg font-semibold">Level {user.level} Runner</p>
            <p className="text-sm text-muted">
              {user.xp} / {user.xp_to_next_level} XP
            </p>
          </div>
          <Badge className="bg-secondary/50 text-white border border-border">Level {user.level + 1} →</Badge>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-secondary/50">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(user.xp / user.xp_to_next_level) * 100}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full rounded-full bg-gradient-to-r from-primary to-orange-400"
          />
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
        className="flex gap-1 rounded-xl bg-secondary/30 p-1"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "relative flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all cursor-pointer",
              activeTab === tab.id
                ? "text-white"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="profile-tab"
                className="absolute inset-0 rounded-lg bg-primary"
                transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        ))}
      </motion.div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === "activities" && (
          <div className="space-y-4">
            {userActivities.map((activity) => (
              <div
                key={activity.id}
                className="card card-interactive p-6"
              >
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12 shrink-0">
                    <AvatarImage src={activity.userAvatar} />
                    <AvatarFallback>{activity.userName.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-base">{activity.title}</h3>
                      <span className="text-xs text-muted shrink-0">
                        {formatRelativeTime(activity.date)}
                      </span>
                    </div>
                    <p className="text-sm text-muted mt-1 line-clamp-2">
                      {activity.description}
                    </p>
                    <div className="mt-4 grid grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-muted">Distance</p>
                        <p className="text-sm font-bold">{formatDistance(activity.distance)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted">Duration</p>
                        <p className="text-sm font-bold">{formatDuration(activity.duration)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted">Pace</p>
                        <p className="text-sm font-bold">{formatPace(activity.pace)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted">Elevation</p>
                        <p className="text-sm font-bold">{activity.elevationGain}m</p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-6 text-sm text-muted">
                      <span className="flex items-center gap-2 cursor-pointer hover:text-red-400">
                        <Heart className={cn("h-4 w-4", activity.isLiked && "fill-red-400 text-red-400")} />
                        {activity.likes}
                      </span>
                      <span className="flex items-center gap-2 cursor-pointer hover:text-foreground">
                        <MessageCircle className="h-4 w-4" />
                        {activity.comments}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "achievements" && (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4">
            {unlockedAchievements.map((ach) => (
              <div
                key={ach.id}
                className="card p-4 text-center"
              >
                <span className="text-3xl">{ach.icon}</span>
                <p className="mt-2 text-xs font-semibold line-clamp-1">{ach.title}</p>
                <p className="text-xs text-muted mt-1">+{ach.xpReward} XP</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === "stats" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: "Total Runs", value: user.total_runs.toString() },
              { label: "Total Distance", value: formatDistance(user.total_distance) },
              { label: "Total Duration", value: formatDuration(user.total_duration) },
              { label: "Current Streak", value: `${user.current_streak} days` },
              { label: "Longest Streak", value: `${user.longest_streak} days` },
              { label: "Level", value: user.level.toString() },
              { label: "Total XP", value: user.xp.toLocaleString() },
              { label: "Followers", value: user.followers_count.toLocaleString() },
              { label: "Following", value: user.following_count.toLocaleString() },
            ].map((stat) => (
              <div key={stat.label} className="card p-5">
                <p className="text-xs text-muted">{stat.label}</p>
                <p className="mt-2 text-xl font-bold">{stat.value}</p>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      <ProfileEditDialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} />
    </div>
  );
}
