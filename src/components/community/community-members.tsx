"use client";

import { useState } from "react";
import { useFetch } from "@/hooks/use-fetch";
import { useAuth } from "@/hooks/use-auth";
import {
  User, Shield, MessageCircle, UserPlus, UserX,
  Flame, Loader2, AlertCircle, RefreshCw, Search,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Link from "next/link";

interface Member {
  id: string; name: string; username: string; avatar: string;
  role: string; totalDistance: number; currentStreak: number;
  level: number; joinedAt: string; weeklyDistance?: number; runsCompleted?: number; lastActive?: string;
}

export function CommunityMembers({ clubId, isAdmin }: { clubId: string; isAdmin: boolean }) {
  const { isAuthenticated } = useAuth();
  const { data, loading, error, refetch } = useFetch<{ data: Member[]; meta: any }>(`/api/clubs/${clubId}/members`);
  const members = data?.data || [];
  const [search, setSearch] = useState("");

  const sorted = [...members].sort((a, b) => {
    const roleOrder = { owner: 0, moderator: 1, member: 2 };
    return (roleOrder[a.role as keyof typeof roleOrder] || 2) - (roleOrder[b.role as keyof typeof roleOrder] || 2);
  });

  const filtered = search.trim()
    ? sorted.filter(m => m.name?.toLowerCase().includes(search.toLowerCase()) || m.username?.toLowerCase().includes(search.toLowerCase()))
    : sorted;

  const handleRemove = async (userId: string) => {
    if (!confirm("Remove this member?")) return;
    try {
      const res = await fetch(`/api/clubs/${clubId}/members?userId=${userId}`, {
        method: "DELETE",
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      toast.success("Member removed");
      refetch();
    } catch { toast.error("Failed to remove"); }
  };

  if (loading) return <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>;

  if (error) return (
    <div className="flex flex-col items-center py-12 text-center">
      <AlertCircle className="h-8 w-8 text-red-400 mb-2" />
      <p className="text-sm text-white/60">Failed to load members</p>
      <Button variant="secondary" size="sm" onClick={refetch} className="mt-3 gap-2"><RefreshCw className="h-3 w-3" /> Retry</Button>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search members..." className="w-full h-9 bg-secondary/30 rounded-xl text-xs text-white placeholder:text-white/30 pl-9 pr-3 focus:outline-none focus:ring-1 focus:ring-primary/30 border border-border" />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center">
          <User className="h-10 w-10 text-white/20 mb-2" />
          <p className="text-sm text-white/40">No members found</p>
        </div>
      ) : (
        filtered.map((member, i) => (
          <motion.div key={member.id || i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
            className="flex items-center gap-3 p-3 rounded-xl border border-border bg-white/[0.03] hover:bg-white/[0.06] transition-all">
            <Link href={`/profile/${member.id}`}>
              {member.avatar ? (
                <img src={member.avatar} alt="" className="w-10 h-10 rounded-xl object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
              )}
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Link href={`/profile/${member.id}`}>
                  <p className="text-sm font-medium text-white hover:text-primary transition-colors">{member.name || "Unknown"}</p>
                </Link>
                {member.role === "owner" && <Shield className="h-3.5 w-3.5 text-primary" />}
                {member.role === "moderator" && <Shield className="h-3.5 w-3.5 text-amber-400" />}
                <Badge variant="secondary" className="text-[9px] px-1.5 py-0 rounded">
                  Lvl {member.level || 1}
                </Badge>
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-[10px] text-white/40">{(member.totalDistance / 1000).toFixed(0)}km</span>
                {member.currentStreak > 0 && (
                  <span className="text-[10px] text-orange-400 flex items-center gap-0.5">
                    <Flame className="h-3 w-3" /> {member.currentStreak}d
                  </span>
                )}
                {member.runsCompleted && (
                  <span className="text-[10px] text-white/40">{member.runsCompleted} runs</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Link href={`/profile/${member.id}`}>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg text-white/30 hover:text-white cursor-pointer">
                  <MessageCircle className="h-3.5 w-3.5" />
                </Button>
              </Link>
              {isAdmin && member.role !== "owner" && (
                <Button onClick={() => handleRemove(member.id)} variant="ghost" size="sm"
                  className="h-7 w-7 p-0 rounded-lg text-white/20 hover:text-red-400 cursor-pointer">
                  <UserX className="h-3 w-3" />
                </Button>
              )}
            </div>
          </motion.div>
        ))
      )}
    </div>
  );
}
