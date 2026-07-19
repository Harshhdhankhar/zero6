"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  MapPin,
  Calendar,
  Users,
  Activity,
  Flame,
  Award,
  Share2,
  Heart,
  MessageCircle,
  UserPlus,
  UserMinus,
} from "lucide-react";
import { useFetch } from "@/hooks/use-fetch";
import { useAppStore } from "@/store/app-store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  formatDistance,
  formatDuration,
  formatPace,
  formatRelativeTime,
  formatDate,
} from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Activity as ActivityT, Achievement, User } from "@/types";

type ProfileTab = "activities" | "achievements" | "stats";

export default function ProfileIdPage() {
  const params = useParams();
  const userId = params.id as string;
  const [activeTab, setActiveTab] = useState<ProfileTab>("activities");
  const [isFollowing, setIsFollowing] = useState(false);
  const currentUser = useAppStore((s) => s.profile);
  
  const { data: profileData } = useFetch<User>(`/api/users/${userId}`);
  const { data: apiActivities } = useFetch<ActivityT[]>(
    profileData ? `/api/activities?userId=${profileData.id}` : ""
  );
  const { data: apiAchievements } = useFetch<Achievement[]>("/api/achievements");
  
  // Initialize isFollowing from profileData
  React.useEffect(() => {
    if (profileData && profileData.isFollowing !== undefined) {
      setIsFollowing(profileData.isFollowing);
    }
  }, [profileData]);
  
  const userActivities = apiActivities || [];
  const allAchievements = apiAchievements || [];
  const unlockedAchievements = allAchievements.filter((a) => a.isUnlocked);

  const tabs: { id: ProfileTab; label: string }[] = [
    { id: "activities", label: "Activities" },
    { id: "achievements", label: "Achievements" },
    { id: "stats", label: "Stats" },
  ];

  const handleFollowToggle = async () => {
    if (!profileData) return;
    try {
      const method = isFollowing ? "DELETE" : "POST";
      await fetch("/api/users/follow", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: profileData.id }),
      });
      setIsFollowing(!isFollowing);
    } catch (error) {
    }
  };

  if (!profileData) return null;

  const isCurrentUser = profileData.isCurrentUser;

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-card overflow-hidden"
      >
        {/* Cover */}
        <div className="h-32 sm:h-40 bg-gradient-to-br from-primary/30 via-accent/20 to-primary/10" />

        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 sm:-mt-10">
            <Avatar className="h-24 w-24 ring-4 ring-card shrink-0">
              <AvatarImage src={profileData.avatar} alt={profileData.name} />
              <AvatarFallback className="text-2xl">
                {profileData.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold">{profileData.name}</h1>
                <Badge variant="secondary" className="text-xs">
                  Level {profileData.level}
                </Badge>
                <Badge className="bg-primary/10 text-primary text-[10px]">
                  {profileData.role}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">@{profileData.username}</p>
            </div>

            <div className="flex gap-2 shrink-0">
              {!isCurrentUser && (
                <Button
                  onClick={handleFollowToggle}
                  variant={isFollowing ? "outline" : "default"}
                  size="sm"
                  className="rounded-lg gap-1.5"
                >
                  {isFollowing ? (
                    <>
                      <UserMinus className="h-3.5 w-3.5" /> Unfollow
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-3.5 w-3.5" /> Follow
                    </>
                  )}
                </Button>
              )}
              <Button variant="outline" size="sm" className="rounded-lg">
                <Share2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">{profileData.bio}</p>

          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {profileData.location}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" /> Joined {formatDate(profileData.joinedAt)}
            </span>
          </div>

          {/* Social Stats */}
          <div className="mt-4 flex gap-6">
            <div className="text-center">
              <p className="text-lg font-bold">{profileData.followers.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">Followers</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold">{profileData.following.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">Following</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold">{profileData.totalRuns}</p>
              <p className="text-[10px] text-muted-foreground">Runs</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-4 text-center">
          <Activity className="mx-auto h-5 w-5 text-primary" />
          <p className="mt-2 text-lg font-bold">{formatDistance(profileData.totalDistance)}</p>
          <p className="text-[10px] text-muted-foreground">Total Distance</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 text-center">
          <Flame className="mx-auto h-5 w-5 text-orange-500" />
          <p className="mt-2 text-lg font-bold">{profileData.currentStreak} days</p>
          <p className="text-[10px] text-muted-foreground">Current Streak</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 text-center">
          <Award className="mx-auto h-5 w-5 text-amber-500" />
          <p className="mt-2 text-lg font-bold">{unlockedAchievements.length}</p>
          <p className="text-[10px] text-muted-foreground">Achievements</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 text-center">
          <Users className="mx-auto h-5 w-5 text-accent" />
          <p className="mt-2 text-lg font-bold">{formatDuration(profileData.totalDuration)}</p>
          <p className="text-[10px] text-muted-foreground">Total Time</p>
        </div>
      </div>

      {/* XP Progress */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Level {profileData.level} Runner</p>
            <p className="text-xs text-muted-foreground">
              {profileData.xp} / {profileData.xpToNextLevel} XP
            </p>
          </div>
          <Badge variant="secondary">Level {profileData.level + 1} →</Badge>
        </div>
        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all"
            style={{ width: `${(profileData.xp / profileData.xpToNextLevel) * 100}%` }}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-secondary/50 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "relative flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all cursor-pointer",
              activeTab === tab.id
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="profile-tab"
                className="absolute inset-0 rounded-lg bg-background shadow-sm"
                transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === "activities" && (
          <div className="space-y-3">
            {userActivities.map((activity) => (
              <div
                key={activity.id}
                className="rounded-2xl border border-border bg-card p-5 transition-all hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={activity.userAvatar} />
                    <AvatarFallback>{activity.userName.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm">{activity.title}</h3>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {formatRelativeTime(activity.date)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {activity.description}
                    </p>
                    <div className="mt-3 grid grid-cols-4 gap-3">
                      <div>
                        <p className="text-[10px] text-muted-foreground">Distance</p>
                        <p className="text-sm font-bold">{formatDistance(activity.distance)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Duration</p>
                        <p className="text-sm font-bold">{formatDuration(activity.duration)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Pace</p>
                        <p className="text-sm font-bold">{formatPace(activity.pace)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Elevation</p>
                        <p className="text-sm font-bold">{activity.elevationGain}m</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1 cursor-pointer hover:text-red-500">
                        <Heart className={cn("h-3.5 w-3.5", activity.isLiked && "fill-red-500 text-red-500")} />
                        {activity.likes}
                      </span>
                      <span className="flex items-center gap-1 cursor-pointer hover:text-foreground">
                        <MessageCircle className="h-3.5 w-3.5" />
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
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {unlockedAchievements.map((ach) => (
              <div
                key={ach.id}
                className="rounded-xl border border-border bg-card p-3 text-center transition-all hover:shadow-md"
              >
                <span className="text-2xl">{ach.icon}</span>
                <p className="mt-1 text-[10px] font-semibold line-clamp-1">{ach.title}</p>
                <p className="text-[9px] text-muted-foreground">+{ach.xpReward} XP</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === "stats" && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              { label: "Total Runs", value: profileData.totalRuns.toString() },
              { label: "Total Distance", value: formatDistance(profileData.totalDistance) },
              { label: "Total Duration", value: formatDuration(profileData.totalDuration) },
              { label: "Current Streak", value: `${profileData.currentStreak} days` },
              { label: "Longest Streak", value: `${profileData.longestStreak} days` },
              { label: "Level", value: profileData.level.toString() },
              { label: "Total XP", value: profileData.xp.toLocaleString() },
              { label: "Followers", value: profileData.followers.toLocaleString() },
              { label: "Following", value: profileData.following.toLocaleString() },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="mt-1 text-lg font-bold">{stat.value}</p>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
