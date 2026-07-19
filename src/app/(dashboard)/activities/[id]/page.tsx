"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  MapPin,
  Flame,
  TrendingUp,
  Heart,
  Mountain,
  Zap,
  SplitSquareHorizontal,
  MessageCircle,
  Share2,
  Trash2,
  Edit3,
  Download,
  Loader2,
} from "lucide-react";
import { useFetch } from "@/hooks/use-fetch";
import { useAppStore } from "@/store/app-store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ActivityComments } from "@/components/shared/activity-comments";
import {
  formatDistance,
  formatDuration,
  formatPace,
  formatDate,
} from "@/lib/utils";

interface ActivityDetail {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  type: string;
  title: string;
  description: string;
  distance: number;
  duration: number;
  pace: number;
  calories: number;
  elevationGain: number;
  heartRateAvg: number;
  heartRateMax: number;
  cadenceAvg: number;
  route: Array<{ lat: number; lng: number; elevation?: number }>;
  splits: Array<{ km: number; time: number; pace: number; elevation: number }>;
  date: string;
  likes: number;
  comments: number;
  isLiked: boolean;
  source: string;
}

function RouteMap({ route }: { route: ActivityDetail["route"] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || route.length < 2) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const padding = 24;

    const lats = route.map((p) => p.lat);
    const lngs = route.map((p) => p.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const latRange = maxLat - minLat || 0.001;
    const lngRange = maxLng - minLng || 0.001;

    const scaleX = (w - padding * 2) / lngRange;
    const scaleY = (h - padding * 2) / latRange;
    const scale = Math.min(scaleX, scaleY);

    const offsetX = (w - lngRange * scale) / 2;
    const offsetY = (h - latRange * scale) / 2;

    const toX = (lng: number) => (lng - minLng) * scale + offsetX;
    const toY = (lat: number) => (maxLat - lat) * scale + offsetY;

    ctx.clearRect(0, 0, w, h);

    ctx.beginPath();
    ctx.moveTo(toX(route[0].lng), toY(route[0].lat));

    for (let i = 1; i < route.length; i++) {
      ctx.lineTo(toX(route[i].lng), toY(route[i].lat));
    }

    ctx.strokeStyle = "#FF5A1F";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();

    ctx.shadowColor = "#FF5A1F";
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.fillStyle = "#22c55e";
    ctx.beginPath();
    ctx.arc(toX(route[0].lng), toY(route[0].lat), 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.arc(
      toX(route[route.length - 1].lng),
      toY(route[route.length - 1].lat),
      5,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }, [route]);

  if (route.length < 2) {
    return (
      <div className="flex items-center justify-center h-48 bg-secondary/30 rounded-xl text-muted-foreground text-sm">
        No route data available
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden bg-secondary/20 border border-border/50">
      <canvas
        ref={canvasRef}
        className="w-full h-48"
        style={{ aspectRatio: "16/9" }}
      />
      <div className="flex justify-between px-4 py-2 text-xs text-muted-foreground border-t border-border/30">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500" /> Start
        </span>
        <span className="flex items-center gap-1">
          End <span className="w-2 h-2 rounded-full bg-red-500" />
        </span>
      </div>
    </div>
  );
}

function SplitsChart({ splits }: { splits: ActivityDetail["splits"] }) {
  if (!splits || splits.length === 0) return null;

  const maxPace = Math.max(...splits.map((s) => s.pace));

  return (
    <div className="space-y-2">
      {splits.map((split) => {
        const heightPct = (split.pace / maxPace) * 100;
        return (
          <div key={split.km} className="flex items-center gap-3">
            <span className="text-xs font-medium text-muted-foreground w-10">
              {split.km}km
            </span>
            <div className="flex-1 h-5 bg-secondary/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary/60 rounded-full transition-all"
                style={{ width: `${heightPct}%` }}
              />
            </div>
            <span className="text-xs font-mono text-foreground w-14 text-right">
              {formatPace(split.pace)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function ActivityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const profile = useAppStore((s) => s.profile);
  const [deleting, setDeleting] = useState(false);

  const { data: raw, loading, error } = useFetch<{ data: ActivityDetail }>(
    `/api/activities/${params.id}`
  );

  const activity = raw?.data;

  async function handleLike() {
    if (!activity) return;
    try {
      const res = await fetch(`/api/activities/${activity.id}/like`, {
        method: activity.isLiked ? "DELETE" : "POST",
      });
      if (res.ok) window.location.reload();
    } catch {}
  }

  async function handleDelete() {
    if (!activity || !confirm("Delete this activity?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/activities/${activity.id}`, {
        method: "DELETE",
      });
      if (res.ok) router.push("/activities");
    } finally {
      setDeleting(false);
    }
  }

  async function handleShare() {
    if (!activity) return;
    const url = `${window.location.origin}/activities/${activity.id}`;
    if (navigator.share) {
      await navigator.share({ title: activity.title, url });
    } else {
      await navigator.clipboard.writeText(url);
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 p-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !activity) {
    return (
      <div className="max-w-3xl mx-auto p-4 text-center">
        <h2 className="text-xl font-bold mb-2">Activity not found</h2>
        <p className="text-muted-foreground mb-4">
          This activity may have been deleted or you don't have access.
        </p>
        <Link
          href="/activities"
          className="text-primary hover:underline text-sm"
        >
          ← Back to activities
        </Link>
      </div>
    );
  }

  const isOwner = profile?.id === activity.userId;

  return (
    <div className="max-w-3xl mx-auto space-y-6 p-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/activities"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="p-2 rounded-lg hover:bg-secondary/50 transition-colors"
            title="Share"
          >
            <Share2 className="w-4 h-4 text-muted-foreground" />
          </button>
          {isOwner && (
            <>
              <button
                onClick={() => router.push(`/activities/${activity.id}/edit`)}
                className="p-2 rounded-lg hover:bg-secondary/50 transition-colors"
                title="Edit"
              >
                <Edit3 className="w-4 h-4 text-muted-foreground" />
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="p-2 rounded-lg hover:bg-red-500/20 transition-colors"
                title="Delete"
              >
                {deleting ? (
                  <Loader2 className="w-4 h-4 text-red-400 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 text-red-400" />
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Activity Title */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Avatar className="w-10 h-10 border-2 border-primary/20">
              <AvatarImage src={activity.userAvatar} />
              <AvatarFallback className="text-xs">
                {activity.userName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold">{activity.userName}</p>
              <p className="text-xs text-muted-foreground">
                {formatDate(activity.date)}
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className="ml-auto capitalize bg-primary/10 text-primary border-primary/30"
          >
            {activity.type} {activity.source === "gps" ? "📍 GPS" : ""}
          </Badge>
        </div>

        <h1 className="text-2xl font-bold mb-2">{activity.title}</h1>
        {activity.description && (
          <p className="text-muted-foreground text-sm mb-4">
            {activity.description}
          </p>
        )}
      </motion.div>

      {/* Route Map */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <RouteMap route={activity.route} />
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3"
      >
        {[
          { icon: MapPin, label: "Distance", value: formatDistance(activity.distance), color: "text-primary" },
          { icon: Clock, label: "Duration", value: formatDuration(activity.duration), color: "text-accent" },
          { icon: Zap, label: "Pace", value: formatPace(activity.pace), color: "text-warning" },
          { icon: Flame, label: "Calories", value: Math.round(activity.calories).toString(), color: "text-orange-400" },
          { icon: Mountain, label: "Elevation", value: `${Math.round(activity.elevationGain)}m`, color: "text-emerald-400" },
          { icon: Heart, label: "Avg HR", value: activity.heartRateAvg ? `${Math.round(activity.heartRateAvg)} bpm` : "--", color: "text-red-400" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="card p-4 text-center flex flex-col items-center gap-1.5"
          >
            <stat.icon className={`w-5 h-5 ${stat.color}`} />
            <div className="text-lg font-bold">{stat.value}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
              {stat.label}
            </div>
          </div>
        ))}
      </motion.div>

      {/* Additional Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="grid grid-cols-3 gap-3"
      >
        {[
          { icon: Heart, label: "Max HR", value: activity.heartRateMax ? `${Math.round(activity.heartRateMax)} bpm` : "--" },
          { icon: TrendingUp, label: "Cadence", value: activity.cadenceAvg ? `${Math.round(activity.cadenceAvg)} spm` : "--" },
          { icon: Download, label: "Source", value: activity.source === "gps" ? "GPS" : "Manual" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-secondary/20 rounded-xl p-3 text-center"
          >
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
              {stat.label}
            </p>
            <p className="text-sm font-semibold">{stat.value}</p>
          </div>
        ))}
      </motion.div>

      {/* Splits */}
      {activity.splits.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <SplitSquareHorizontal className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold">Splits</h3>
          </div>
          <SplitsChart splits={activity.splits} />
        </motion.div>
      )}

      {/* Like & Comment Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="flex items-center gap-4"
      >
        <button
          onClick={handleLike}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
            activity.isLiked
              ? "border-red-500/50 bg-red-500/10 text-red-400"
              : "border-border/50 bg-secondary/20 text-muted-foreground hover:bg-secondary/40"
          }`}
        >
          <Heart
            className={`w-4 h-4 ${activity.isLiked ? "fill-red-400" : ""}`}
          />
          <span className="text-sm">{activity.likes}</span>
        </button>

        <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border/50 bg-secondary/20 text-muted-foreground">
          <MessageCircle className="w-4 h-4" />
          <span className="text-sm">{activity.comments}</span>
        </div>
      </motion.div>

      {/* Comments */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-primary" />
          Comments
        </h3>
        <ActivityComments activityId={activity.id} commentCount={activity.comments} />
      </motion.div>
    </div>
  );
}
