"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Gift, Star, ShoppingBag, Leaf, Sparkles, Ticket, Tag, Check } from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Reward, RewardCategory } from "@/types";

const rewards: Reward[] = [
  {
    id: "reward-1", title: "ZERO6 Running Cap", description: "Premium moisture-wicking cap with ZERO6 logo", icon: "🧢", cost: 2500, category: "merch", isRedeemed: false,
  },
  {
    id: "reward-2", title: "1-on-1 Coaching Session", description: "Personal coaching call with a professional runner", icon: "🎯", cost: 5000, category: "experience", isRedeemed: false,
  },
  {
    id: "reward-3", title: "Custom Training Plan", description: "Personalized training plan for your next race", icon: "📋", cost: 3000, category: "digital", isRedeemed: true, redeemedAt: "2025-05-15T08:00:00Z",
  },
  {
    id: "reward-4", title: "Running Shoes Voucher", description: "$50 off any pair of running shoes at partner stores", icon: "👟", cost: 8000, category: "gear", isRedeemed: false,
  },
  {
    id: "reward-5", title: "Tree Planted", description: "We plant a tree in your name for every 5K you run", icon: "🌳", cost: 1000, category: "donation", isRedeemed: false,
  },
  {
    id: "reward-6", title: "Exclusive Race Entry", description: "Free entry to a partner running event", icon: "🎫", cost: 10000, category: "experience", isRedeemed: false,
  },
];

const categoryIcons: Record<RewardCategory, React.ElementType> = {
  gear: ShoppingBag,
  experience: Ticket,
  digital: Sparkles,
  donation: Leaf,
  merch: Tag,
};

const categoryColors: Record<RewardCategory, string> = {
  gear: "text-blue-500 bg-blue-500/10",
  experience: "text-purple-500 bg-purple-500/10",
  digital: "text-primary bg-primary/10",
  donation: "text-emerald-500 bg-emerald-500/10",
  merch: "text-amber-500 bg-amber-500/10",
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function RewardsPage() {
  const [filter, setFilter] = useState<string>("all");
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const user = useAppStore((s) => s.profile);
  const xpBalance = user?.xp || 0;

  const filteredRewards = rewards.filter((r) => {
    if (filter === "all") return true;
    if (filter === "affordable") return r.cost <= xpBalance && !r.isRedeemed;
    if (filter === "redeemed") return r.isRedeemed;
    return r.category === filter;
  });

  const handleRedeem = async (rewardId: string, cost: number) => {
    if (xpBalance < cost) return;
    
    setRedeemingId(rewardId);
    try {
      const res = await fetch("/api/rewards/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rewardId, cost }),
      });
      if (res.ok) {
        // Update local state - mark as redeemed
        const reward = rewards.find(r => r.id === rewardId);
        if (reward) {
          reward.isRedeemed = true;
          reward.redeemedAt = new Date().toISOString();
        }
        // Update user XP balance in store
      }
    } catch (error) {
    } finally {
      setRedeemingId(null);
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
              <Gift className="w-3 h-3" />
              Rewards
            </div>
            <h1 className="display-heading text-4xl md:text-5xl lg:text-6xl mb-4">
              Redeem Your <span className="text-gradient">Rewards</span>
            </h1>
            <p className="text-lg text-gray-300 mb-6 max-w-lg">
              Turn your hard-earned XP into exclusive rewards. From gear to experiences, celebrate your achievements.
            </p>
          </div>
        </div>
      </motion.div>

      {/* XP Balance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="glass-strong p-6 rounded-2xl"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted">
              Your XP Balance
            </p>
            <p className="mt-1 text-4xl font-bold text-gradient">
              {xpBalance.toLocaleString()}
            </p>
            <p className="text-sm text-muted mt-1">
              Level {user?.level || 1} · {(user?.xp_to_next_level || 1000) - (user?.xp || 0)} XP to next level
            </p>
          </div>
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20 border border-primary/30">
            <Star className="h-8 w-8 text-primary" />
          </div>
        </div>
        {/* Level Progress */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted">Level {user?.level || 1}</span>
            <span className="text-muted">Level {(user?.level || 1) + 1}</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-secondary/50">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${((user?.xp || 0) / (user?.xp_to_next_level || 1000)) * 100}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-r from-primary to-orange-400"
            />
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="flex flex-wrap gap-3"
      >
        {[
          { value: "all", label: "All Rewards" },
          { value: "affordable", label: "Can Afford" },
          { value: "redeemed", label: "Redeemed" },
          { value: "digital", label: "Digital" },
          { value: "merch", label: "Merch" },
          { value: "gear", label: "Gear" },
          { value: "experience", label: "Experiences" },
          { value: "donation", label: "Donations" },
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

      {/* Rewards Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {filteredRewards.map((reward) => {
          const Icon = categoryIcons[reward.category];
          const canAfford = xpBalance >= reward.cost;

          return (
            <motion.div key={reward.id} variants={itemVariants}>
              <div
                className={cn(
                  "card card-interactive p-6",
                  reward.isRedeemed
                    ? "border-green-500/30 opacity-75"
                    : canAfford
                    ? ""
                    : "opacity-60"
                )}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="text-4xl">{reward.icon}</div>
                  <Badge className={cn("text-xs", categoryColors[reward.category])}>
                    {reward.category}
                  </Badge>
                </div>

                <h3 className="heading-md text-lg mb-2">{reward.title}</h3>
                <p className="text-sm text-muted line-clamp-2 mb-4">
                  {reward.description}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-primary" />
                    <span className="text-base font-bold">{reward.cost.toLocaleString()} XP</span>
                  </div>
                  <Button
                    size="sm"
                    className="rounded-xl text-sm"
                    variant={reward.isRedeemed ? "secondary" : canAfford ? "default" : "outline"}
                    disabled={!canAfford && !reward.isRedeemed || redeemingId === reward.id}
                    onClick={() => canAfford && !reward.isRedeemed && handleRedeem(reward.id, reward.cost)}
                  >
                    {redeemingId === reward.id ? (
                      "Redeeming..."
                    ) : reward.isRedeemed ? (
                      <>
                        <Check className="h-4 w-4 mr-2" /> Redeemed
                      </>
                    ) : canAfford ? (
                      "Redeem"
                    ) : (
                      "Not enough XP"
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
