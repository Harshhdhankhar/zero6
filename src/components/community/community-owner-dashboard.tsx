"use client";

import { useState } from "react";
import { useFetch } from "@/hooks/use-fetch";
import {
  Shield, Users, Calendar, BarChart3, Activity, TrendingUp,
  Loader2, AlertCircle, RefreshCw, CheckCircle, XCircle,
  UserCheck, UserX, Plus,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Analytics {
  totalMembers: number; activeMembers: number; totalPosts: number;
  totalEvents: number; totalChallenges: number;
  avgPace: number; avgWeeklyDistance: number;
  monthlyRegistrations: { month: string; count: number }[];
}

interface JoinRequest {
  id: string; userId: string; name: string;
  username: string; avatar: string; status: string; createdAt: string;
}

export function CommunityOwnerDashboard({ clubId }: { clubId: string }) {
  const [activeSection, setActiveSection] = useState<"overview" | "members" | "analytics">("overview");
  const { data: analyticsData, loading: analyticsLoading, error: analyticsError, refetch: refetchAnalytics } = useFetch<{ data: Analytics }>(`/api/clubs/${clubId}/analytics`);
  const { data: membersData, loading: membersLoading, refetch: refetchMembers } = useFetch<{ data: any[] }>(`/api/clubs/${clubId}/members?limit=100`);
  const { data: requestsData, loading: requestsLoading, refetch: refetchRequests } = useFetch<{ data: JoinRequest[] }>(`/api/clubs/${clubId}/join-requests`);

  const analytics = analyticsData?.data;
  const allMembers = membersData?.data || [];

  if (activeSection === "analytics") {
    if (analyticsLoading) return <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>;
    if (analyticsError) return (
      <div className="flex flex-col items-center py-12 text-center">
        <AlertCircle className="h-8 w-8 text-red-400 mb-2" />
        <p className="text-sm text-white/60">Failed to load analytics</p>
        <Button variant="secondary" size="sm" onClick={refetchAnalytics} className="mt-3 gap-2"><RefreshCw className="h-3 w-3" /> Retry</Button>
      </div>
    );
    if (!analytics) return null;

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Members", value: analytics.totalMembers, icon: Users, color: "text-blue-400 bg-blue-500/10" },
            { label: "Active (30d)", value: analytics.activeMembers, icon: Activity, color: "text-emerald-400 bg-emerald-500/10" },
            { label: "Total Posts", value: analytics.totalPosts, icon: BarChart3, color: "text-purple-400 bg-purple-500/10" },
            { label: "Avg Weekly", value: `${analytics.avgWeeklyDistance.toFixed(1)}km`, icon: TrendingUp, color: "text-amber-400 bg-amber-500/10" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-border bg-white/[0.03] p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className={cn("p-1.5 rounded-lg", stat.color)}><stat.icon className="h-3.5 w-3.5" /></div>
                <span className="text-[9px] text-white/40 uppercase tracking-wider">{stat.label}</span>
              </div>
              <p className="text-lg font-bold text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-white/[0.03] p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Monthly Registrations</h3>
          <div className="flex items-end gap-2 h-32">
            {analytics.monthlyRegistrations.map((m, i) => {
              const maxCount = Math.max(...analytics.monthlyRegistrations.map(r => r.count), 1);
              const height = (m.count / maxCount) * 100;
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[9px] text-white/40">{m.count}</span>
                  <div className="w-full rounded-lg bg-gradient-to-t from-primary/40 to-primary/10"
                    style={{ height: `${Math.max(height, 5)}%` }} />
                  <span className="text-[8px] text-white/30">{m.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Events", value: analytics.totalEvents, color: "text-purple-400" },
            { label: "Challenges", value: analytics.totalChallenges, color: "text-amber-400" },
            { label: "Avg Pace", value: `${analytics.avgPace.toFixed(2)}/km`, color: "text-emerald-400" },
            { label: "Events + Posts", value: analytics.totalEvents + analytics.totalPosts, color: "text-blue-400" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-border bg-white/[0.03] p-3 text-center">
              <p className={cn("text-lg font-bold", stat.color)}>{stat.value}</p>
              <p className="text-[9px] text-white/40 uppercase tracking-wider mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activeSection === "members") {
    const handleRemove = async (userId: string) => {
      if (!confirm("Remove this member?")) return;
      try {
        const res = await fetch(`/api/clubs/${clubId}/members?userId=${userId}`, {
          method: "DELETE",
        });
        if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
        toast.success("Member removed");
        refetchMembers();
      } catch { toast.error("Failed to remove"); }
    };

    const handleApproveReject = async (requestId: string, action: "approve" | "reject") => {
      try {
        const res = await fetch(`/api/clubs/${clubId}/join-requests`, {
          method: "POST",
          body: JSON.stringify({ requestId, action }),
        });
        if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
        toast.success(action === "approve" ? "Request approved" : "Request rejected");
        refetchRequests();
        if (action === "approve") refetchMembers();
      } catch { toast.error("Failed to process request"); }
    };

    const requests = requestsData?.data || [];
    const loading = membersLoading || requestsLoading;
    if (loading) return <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>;

    return (
      <div className="space-y-6">
        {/* Pending Join Requests */}
        {requests.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Pending Requests ({requests.length})</h3>
            <div className="space-y-2">
              {requests.map((req) => (
                <div key={req.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-white/[0.03]">
                  {req.avatar ? (
                    <img src={req.avatar} alt="" className="w-9 h-9 rounded-xl object-cover" />
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-secondary/50 flex items-center justify-center">
                      <Users className="h-4 w-4 text-white/40" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{req.name || req.username || "Unknown"}</p>
                    <p className="text-[10px] text-white/40">Requested to join</p>
                  </div>
                  <div className="flex gap-1.5">
                    <Button onClick={() => handleApproveReject(req.id, "approve")} size="sm"
                      className="h-7 px-2.5 rounded-lg gap-1 text-[11px] cursor-pointer">
                      <CheckCircle className="h-3 w-3" /> Approve
                    </Button>
                    <Button onClick={() => handleApproveReject(req.id, "reject")} size="sm" variant="secondary"
                      className="h-7 px-2.5 rounded-lg gap-1 text-[11px] cursor-pointer">
                      <XCircle className="h-3 w-3" /> Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Current Members */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">Members ({allMembers.length})</h3>
            <Badge variant="secondary" className="text-[10px]">
              <UserCheck className="h-3 w-3 mr-1" /> {allMembers.filter((m: any) => m.role === "owner").length} Owner
            </Badge>
          </div>
          <div className="space-y-2">
            {allMembers.map((member: any) => (
              <div key={member.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-white/[0.03]">
                {member.avatar ? (
                  <img src={member.avatar} alt="" className="w-9 h-9 rounded-xl object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-secondary/50 flex items-center justify-center"><Shield className="h-4 w-4 text-white/40" /></div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{member.name}</p>
                  <p className="text-[10px] text-white/40 capitalize">{member.role} · {(member.totalDistance / 1000).toFixed(0)}km</p>
                </div>
                {member.role !== "owner" && (
                  <Button onClick={() => handleRemove(member.id)} variant="ghost" size="sm"
                    className="h-7 w-7 p-0 rounded-lg text-white/20 hover:text-red-400 cursor-pointer">
                    <UserX className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Overview
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {[
        { label: "Member Management", desc: "Approve requests, remove members, assign roles", icon: Users, section: "members" },
        { label: "Analytics Dashboard", desc: "View growth, attendance, popular routes", icon: BarChart3, section: "analytics" },
        { label: "Create Event", desc: "Schedule runs, set capacity, generate QR codes", icon: Calendar, section: "events", isTab: true },
        { label: "Create Challenge", desc: "Set distance goals, streaks, and badges", icon: Activity, section: "challenges", isTab: true },
      ].map((item) => {
        const Section = item.isTab ? "a" : "button";
        const onClick = item.isTab
          ? undefined
          : () => setActiveSection(item.section as any);
        const href = item.isTab ? `/communities/${clubId}?tab=${item.section}` : undefined;
        return (
          <Section key={item.section} onClick={onClick} href={href}
            className="rounded-2xl border border-border bg-white/[0.03] p-4 hover:bg-white/[0.06] hover:border-border transition-all text-left cursor-pointer block">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-primary/20"><item.icon className="h-4 w-4 text-primary" /></div>
              <span className="text-sm font-semibold text-white">{item.label}</span>
            </div>
            <p className="text-[11px] text-white/40">{item.desc}</p>
          </Section>
        );
      })}
    </div>
  );
}
