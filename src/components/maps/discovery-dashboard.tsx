"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Activity,
  Calendar,
  MapPin,
  Camera,
  TreePine,
  ChevronDown,
  ChevronUp,
  Sparkles,
  TrendingUp,
  Clock,
  Zap,
} from "lucide-react";
import { useFetch } from "@/hooks/use-fetch";
import { cn } from "@/lib/utils";

interface DiscoveryStats {
  communities: number;
  liveRunners: number;
  eventsThisWeek: number;
  popularRoutes: number;
  communityPhotos: number;
  runningSpots: number;
}

interface DiscoveryCard {
  id: string;
  icon: React.ElementType;
  label: string;
  count: number;
  color: string;
  onClick: () => void;
}

export function DiscoveryDashboard() {
  const [expanded, setExpanded] = useState(true);
  const [stats, setStats] = useState<DiscoveryStats>({
    communities: 0,
    liveRunners: 0,
    eventsThisWeek: 0,
    popularRoutes: 0,
    communityPhotos: 0,
    runningSpots: 0,
  });

  const { data: nearbyData, loading } = useFetch<any>("/api/maps/discovery");

  useEffect(() => {
    if (nearbyData) {
      setStats({
        communities: nearbyData.communities || 0,
        liveRunners: nearbyData.liveRunners || 0,
        eventsThisWeek: nearbyData.eventsThisWeek || 0,
        popularRoutes: nearbyData.popularRoutes || 0,
        communityPhotos: nearbyData.communityPhotos || 0,
        runningSpots: nearbyData.runningSpots || 0,
      });
    }
  }, [nearbyData]);

  const cards: DiscoveryCard[] = [
    {
      id: "communities",
      icon: Users,
      label: "Running Communities",
      count: stats.communities,
      color: "from-blue-500/20 to-cyan-500/20",
      onClick: () => {},
    },
    {
      id: "live-runners",
      icon: Activity,
      label: "Live Runners",
      count: stats.liveRunners,
      color: "from-emerald-500/20 to-green-500/20",
      onClick: () => {},
    },
    {
      id: "events",
      icon: Calendar,
      label: "Events This Week",
      count: stats.eventsThisWeek,
      color: "from-purple-500/20 to-pink-500/20",
      onClick: () => {},
    },
    {
      id: "routes",
      icon: MapPin,
      label: "Popular Routes",
      count: stats.popularRoutes,
      color: "from-orange-500/20 to-red-500/20",
      onClick: () => {},
    },
    {
      id: "photos",
      icon: Camera,
      label: "Community Photos",
      count: stats.communityPhotos,
      color: "from-pink-500/20 to-rose-500/20",
      onClick: () => {},
    },
    {
      id: "spots",
      icon: TreePine,
      label: "Running Spots",
      count: stats.runningSpots,
      color: "from-green-500/20 to-emerald-500/20",
      onClick: () => {},
    },
  ];

  const total = Object.values(stats).reduce((sum, val) => sum + val, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="absolute top-4 left-4 right-4 z-20"
    >
      <div className="bg-card/80 backdrop-blur-xl border border-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <Sparkles className="h-5 w-5 text-primary" />
              <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Around You</h2>
              <p className="text-xs text-white/40">
                {total} {total === 1 ? "item" : "items"} nearby
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {loading && (
              <div className="h-4 w-4 rounded-full border-2 border-border border-t-[#FF5A1F] animate-spin" />
            )}
            {expanded ? (
              <ChevronUp className="h-4 w-4 text-white/40" />
            ) : (
              <ChevronDown className="h-4 w-4 text-white/40" />
            )}
          </div>
        </div>

        {/* Cards Grid */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="p-4 grid grid-cols-2 gap-3">
                {cards.map((card, index) => {
                  const Icon = card.icon;
                  return (
                    <motion.button
                      key={card.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={card.onClick}
                      className={cn(
                        "relative group p-4 rounded-xl border border-border",
                        "bg-gradient-to-br",
                        card.color,
                        "hover:border-primary/30 transition-all duration-300",
                        "cursor-pointer"
                      )}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="p-2 rounded-lg bg-black/30">
                          <Icon className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 text-white/40" />
                          <span className="text-xs font-semibold text-white">
                            {card.count}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs font-medium text-white/90 text-left">
                        {card.label}
                      </p>
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </motion.button>
                  );
                })}
              </div>

              {/* Quick Actions */}
              <div className="px-4 pb-4 flex gap-2">
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-medium hover:bg-primary/90 transition-colors cursor-pointer">
                  <Zap className="h-3.5 w-3.5" />
                  Explore All
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-border text-white/70 text-xs font-medium hover:bg-white/10 hover:text-white transition-colors cursor-pointer">
                  <Clock className="h-3.5 w-3.5" />
                  Recent Activity
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
