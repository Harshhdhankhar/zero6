"use client";

import {
  MapPin, Calendar, Users, Shield, Activity, Verified,
} from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

interface ClubDetail {
  id: string; name: string; description: string; avatar: string; coverImage: string;
  location: string; memberCount: number; activityCount: number; isMember: boolean;
  createdBy: string; createdByName: string; category: string; tags: string[];
  createdAt: string; members: any[];
  rules?: string[]; socialLinks?: any; isVerified?: boolean;
}

export function CommunityAbout({ club }: { club: ClubDetail | null }) {
  if (!club) return null;

  const details = [
    { label: "Category", value: club.category, icon: Activity },
    { label: "Location", value: club.location || "India", icon: MapPin },
    { label: "Members", value: club.memberCount.toLocaleString(), icon: Users },
    { label: "Founded", value: new Date(club.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }), icon: Calendar },
    { label: "Created by", value: club.createdByName || "Unknown", icon: Shield },
  ];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-white/[0.03] p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0">
            {club.avatar ? <img src={club.avatar} alt={club.name} className="w-full h-full object-cover" /> : (
              <div className="w-full h-full bg-gradient-to-br from-primary/30 to-purple-500/30 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">{club.name}</h2>
              {club.isVerified && <Verified className="h-4 w-4 text-cyan-400" />}
            </div>
            <p className="text-xs text-white/40 mt-0.5">{club.location || "India"} · {club.category}</p>
          </div>
        </div>

        <p className="text-sm text-white/70 leading-relaxed">{club.description}</p>

        {club.tags && club.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {club.tags.map((tag: string) => (
              <span key={tag} className="px-2.5 py-1 rounded-lg bg-secondary/30 text-[10px] text-white/40 border border-border">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </motion.div>

      {/* Details Grid */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {details.map((d) => (
          <div key={d.label} className="rounded-xl border border-border bg-white/[0.03] p-3">
            <div className="flex items-center gap-2 mb-2">
              <d.icon className="h-3.5 w-3.5 text-primary" />
              <span className="text-[10px] text-white/40 uppercase tracking-wider">{d.label}</span>
            </div>
            <p className="text-sm font-semibold text-white capitalize">{d.value}</p>
          </div>
        ))}
      </motion.div>

      {club.rules && club.rules.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-2xl border border-border bg-white/[0.03] p-5">
          <h3 className="text-sm font-semibold text-white mb-3">Community Rules</h3>
          <ul className="space-y-2">
            {club.rules.map((rule, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-white/60">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                {rule}
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </div>
  );
}
