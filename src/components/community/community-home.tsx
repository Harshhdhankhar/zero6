"use client";

import { motion } from "framer-motion";
import { useFetch } from "@/hooks/use-fetch";
import {
  Activity, Calendar, Users, Route,
  ArrowRight, Clock, Trophy, Camera, MapPin,
  Zap, MessageSquare,
} from "lucide-react";
import { cn, formatDistance } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

interface ClubDetail {
  id: string; name: string; description: string; avatar: string; coverImage: string;
  location: string; memberCount: number; activityCount: number; isMember: boolean;
  createdBy: string; createdByName: string; category: string; tags: string[];
  createdAt: string; members: any[];
  welcomeMessage?: string; chatEnabled?: boolean; galleryEnabled?: boolean;
  eventsEnabled?: boolean; runsEnabled?: boolean; routesEnabled?: boolean;
}

interface CommunityStats {
  totalMembers: number; totalPosts: number; totalEvents: number;
  totalChallenges: number; totalGalleryItems: number; totalChatMessages: number;
  totalRoutes: number; totalRuns: number; activeMembers7d: number;
  avgWeeklyDistance: number;
}

export function CommunityHome({ clubId, club }: { clubId: string; club: ClubDetail | null }) {
  const { data: eventsData } = useFetch<{ data: any[] }>(`/api/events?clubId=${clubId}&limit=5`);
  const { data: feedData } = useFetch<{ data: any[] }>(`/api/clubs/${clubId}/feed?limit=3`);
  const { data: runsData } = useFetch<{ data: any[] }>(`/api/clubs/${clubId}/runs?status=upcoming`);
  const { data: statsData } = useFetch<{ data: CommunityStats }>(`/api/clubs/${clubId}/stats`);
  const events = eventsData?.data || [];
  const posts = feedData?.data || [];
  const runs = runsData?.data || [];
  const stats = statsData?.data;

  if (!club) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
    );
  }

  const displayStats = [
    { label: "Members", value: stats?.totalMembers || club.memberCount, icon: Users, color: "text-blue-400 bg-blue-500/10" },
    { label: "Posts", value: stats?.totalPosts || 0, icon: MessageSquare, color: "text-emerald-400 bg-emerald-500/10" },
    { label: "Events", value: stats?.totalEvents || events.length, icon: Calendar, color: "text-purple-400 bg-purple-500/10" },
    { label: "Active 7d", value: stats?.activeMembers7d || 0, icon: Zap, color: "text-amber-400 bg-amber-500/10" },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-gradient-to-br from-primary/10 to-purple-500/10 border border-border p-5">
        <h2 className="text-lg font-bold text-white">
          {club.welcomeMessage || `Welcome to ${club.name}! 👋`}
        </h2>
        <p className="text-sm text-white/60 mt-1">{club.description}</p>
        <div className="flex flex-wrap gap-2 mt-3">
          {club.tags?.map((tag: string) => (
            <span key={tag} className="px-2.5 py-1 rounded-lg bg-secondary/30 text-[10px] text-white/40 border border-border">#{tag}</span>
          ))}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Community Runs", icon: Users, href: `/communities/${clubId}?tab=runs`, color: "bg-primary", show: club.runsEnabled },
          { label: "Routes", icon: Route, href: `/communities/${clubId}?tab=routes`, color: "bg-emerald-500", show: club.routesEnabled },
          { label: "Leaderboard", icon: Trophy, href: `/communities/${clubId}?tab=leaderboard`, color: "bg-amber-500", show: true },
          { label: "Gallery", icon: Camera, href: `/communities/${clubId}?tab=gallery`, color: "bg-purple-500", show: club.galleryEnabled },
        ].filter(item => item.show).map((item) => (
          <Link key={item.label} href={item.href}>
            <div className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border bg-white/[0.03] hover:bg-white/[0.06] transition-all cursor-pointer group">
              <div className={cn("p-2 rounded-lg", item.color)}><item.icon className="h-4 w-4 text-white" /></div>
              <span className="text-[11px] font-medium text-white/60 group-hover:text-white transition-colors">{item.label}</span>
            </div>
          </Link>
        ))}
      </motion.div>

      {/* Stats */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {displayStats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-white/[0.03] p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className={cn("p-1.5 rounded-lg", stat.color)}><stat.icon className="h-3.5 w-3.5" /></div>
              <span className="text-[10px] text-white/40 uppercase tracking-wider">{stat.label}</span>
            </div>
            <p className="text-lg font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </motion.div>

      {/* Community Runs */}
      {club.runsEnabled && runs.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">Upcoming Group Runs</h3>
            <Link href={`/communities/${clubId}?tab=runs`} className="text-[11px] text-primary hover:text-primary/80 flex items-center gap-1">
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {runs.slice(0, 2).map((run: any) => (
              <div key={run.id}
                className="rounded-xl border border-border bg-white/[0.03] p-3 hover:bg-white/[0.06] transition-all">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-orange-500/20 flex items-center justify-center shrink-0">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{run.title}</p>
                    <p className="text-[11px] text-white/40 mt-0.5">
                      {new Date(run.scheduledAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      {run.distance ? ` · ${run.distance}km` : ""}
                    </p>
                    <p className="text-[10px] text-white/30 mt-0.5">
                      {run.registeredCount}/{run.maxParticipants} joined
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Upcoming Events */}
      {club.eventsEnabled && events.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">Upcoming Events</h3>
            <Link href={`/communities/${clubId}?tab=events`} className="text-[11px] text-primary hover:text-primary/80 flex items-center gap-1">
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {events.slice(0, 2).map((event: any) => (
              <Link key={event.id} href={`/events/${event.id}`}
                className="rounded-xl border border-border bg-white/[0.03] p-3 hover:bg-white/[0.06] transition-all">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center shrink-0">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{event.title}</p>
                    <p className="text-[11px] text-white/40 mt-0.5">
                      {new Date(event.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                      {event.distance ? ` · ${formatDistance(event.distance)}` : ""}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      {/* Recent Posts */}
      {posts.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">Latest Updates</h3>
            <Link href={`/communities/${clubId}?tab=feed`} className="text-[11px] text-primary hover:text-primary/80 flex items-center gap-1">
              View Feed <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {posts.map((post: any) => (
              <div key={post.id} className="rounded-xl border border-border bg-white/[0.03] p-3">
                <div className="flex items-center gap-2 mb-2">
                  {post.user?.avatar ? (
                    <img src={post.user.avatar} alt="" className="w-6 h-6 rounded-lg object-cover" />
                  ) : (
                    <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Users className="h-3 w-3 text-primary" />
                    </div>
                  )}
                  <span className="text-xs font-medium text-white">{post.user?.name || "Member"}</span>
                  {post.postType && post.postType !== "post" && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-secondary/30 text-white/30 capitalize">{post.postType.replace("_", " ")}</span>
                  )}
                  <span className="text-[10px] text-white/30">{new Date(post.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-xs text-white/70 line-clamp-2">{post.content}</p>
                {post.imageUrl && (
                  <img src={post.imageUrl} alt="" className="mt-2 max-h-32 rounded-xl object-cover" />
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
