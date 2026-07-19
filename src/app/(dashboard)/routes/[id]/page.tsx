"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  MapPin,
  Star,
  Users,
  Clock,
  Route,
  Share2,
  Bookmark,
  Heart,
  Camera,
  ThumbsUp,
  Send,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { useFetch } from "@/hooks/use-fetch";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatDistance, formatPace, formatRelativeTime } from "@/lib/utils";
import type { Route as RouteType, RoutePoint } from "@/types";

const difficultyColors: Record<string, string> = {
  easy: "bg-emerald-500/15 text-emerald-500 border-emerald-500/20",
  moderate: "bg-amber-500/15 text-amber-500 border-amber-500/20",
  hard: "bg-orange-500/15 text-orange-500 border-orange-500/20",
  extreme: "bg-red-500/15 text-red-500 border-red-500/20",
};

function DetailSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-32" />
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-48 rounded-xl" />
      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function RouteDetailPage() {
  const params = useParams();
  const { isAuthenticated, profile } = useAuth();
  const routeId = params.id as string;

  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);

  const { data: routeData, loading, refetch } = useFetch<any>(`/api/routes/${routeId}`);

  const route = routeData as RouteType | null;

  useEffect(() => {
    if (route) {
      setIsBookmarked(route.isBookmarked || false);
      setIsLiked(route.isLiked || false);
      setLikeCount(route.statistics?.likeCount || 0);
    }
  }, [route]);

  const handleBookmark = useCallback(async () => {
    try {
      const res = await fetch(`/api/routes/${routeId}/bookmark`, { method: "POST" });
      const json = await res.json();
      setIsBookmarked(json.data.bookmarked);
    } catch {}
  }, [routeId]);

  const handleLike = useCallback(async () => {
    try {
      const res = await fetch(`/api/routes/${routeId}/like`, {
        method: isLiked ? "DELETE" : "POST",
      });
      const json = await res.json();
      setIsLiked(json.data.liked);
      setLikeCount(json.data.count);
    } catch {}
  }, [routeId, isLiked]);

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: route?.title || "Route", url });
    } else {
      await navigator.clipboard.writeText(url);
    }
  }, [route]);

  const handleSubmitReview = useCallback(async () => {
    if (!reviewText.trim() || submittingReview) return;
    setSubmittingReview(true);
    try {
      const res = await fetch(`/api/routes/${routeId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: reviewRating, comment: reviewText }),
      });
      if (res.ok) {
        setReviewText("");
        setReviewRating(5);
        refetch();
      }
    } catch {}
    setSubmittingReview(false);
  }, [routeId, reviewText, reviewRating, submittingReview, refetch]);

  const { data: nearbyData } = useFetch<any[]>(
    route?.geometry?.[0]
      ? `/api/routes/nearby?lat=${route.geometry[0].lat}&lng=${route.geometry[0].lng}&radius=10&limit=4`
      : ""
  );

  const nearbyRoutes = nearbyData || [];

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-10 w-24" />
        <DetailSkeleton />
      </div>
    );
  }

  if (!route) {
    return (
      <div className="text-center py-16">
        <Route className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Route not found</p>
        <Link href="/routes">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Routes
          </Button>
        </Link>
      </div>
    );
  }

  const photos = route.photos || [];
  const reviews = route.reviews || [];
  const stats = route.statistics;
  const avgRating = stats?.averageRating || 0;
  const geometry = route.geometry || [];

  return (
    <div className="max-w-4xl mx-auto">
      <Link href="/routes">
        <Button variant="ghost" className="mb-4 -ml-2">
          <ArrowLeft className="h-4 w-4 mr-2" /> Routes
        </Button>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold">{route.title}</h1>
            {route.city && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                <MapPin className="h-4 w-4" />
                {route.city}
                {route.state && `, ${route.state}`}
              </div>
            )}
            {route.creator && (
              <div className="flex items-center gap-2 mt-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={route.creator.avatar} alt={route.creator.name} />
                  <AvatarFallback>{route.creator.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{route.creator.name}</p>
                  <p className="text-xs text-muted-foreground">@{route.creator.username}</p>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLike}
              className={cn(isLiked && "text-red-500")}
            >
              <Heart className={cn("h-5 w-5", isLiked && "fill-red-500")} />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleBookmark}>
              <Bookmark className={cn("h-5 w-5", isBookmarked && "fill-primary text-primary")} />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleShare}>
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge className={cn("text-xs", difficultyColors[route.difficulty])}>
            {route.difficulty.charAt(0).toUpperCase() + route.difficulty.slice(1)}
          </Badge>
          <Badge variant="secondary" className="text-xs capitalize">
            {route.surfaceType}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {route.routeType === "out-and-back" ? "Out & Back" : route.routeType.charAt(0).toUpperCase() + route.routeType.slice(1)}
          </Badge>
          {route.tags?.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">#{tag}</Badge>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Distance", value: formatDistance(route.distance) },
            { label: "Elevation", value: `${(route.elevationGain || 0).toFixed(0)}m` },
            { label: "Est. Pace", value: route.paceEstimate > 0 ? formatPace(route.paceEstimate) : "—" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl bg-secondary/50 p-4 text-center">
              <p className="text-xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {route.description && (
          <p className="text-sm text-muted-foreground">{route.description}</p>
        )}

        <div className="rounded-xl overflow-hidden border border-border bg-card h-64">
          <RouteMapCanvas geometry={geometry} />
        </div>

        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: Route, label: "Total Runs", value: stats.totalRuns },
              { icon: Users, label: "Unique Runners", value: stats.uniqueRunners },
              { icon: Clock, label: "Avg Pace", value: stats.averagePace > 0 ? formatPace(stats.averagePace) : "—" },
              { icon: Star, label: "Avg Rating", value: avgRating > 0 ? `${avgRating.toFixed(1)} (${stats.reviewCount})` : "No ratings" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl bg-secondary/50 p-3 text-center">
                <stat.icon className="h-5 w-5 text-primary mx-auto mb-1" />
                <p className="text-sm font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {photos.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Gallery ({photos.length})
            </h3>
            <div className="relative rounded-xl overflow-hidden h-64 bg-secondary">
              <img
                src={photos[photoIndex]?.url}
                alt={photos[photoIndex]?.caption || "Route photo"}
                className="w-full h-full object-cover"
              />
              {photos.length > 1 && (
                <>
                  <button
                    onClick={() => setPhotoIndex((i) => (i - 1 + photos.length) % photos.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setPhotoIndex((i) => (i + 1) % photos.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {photos.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setPhotoIndex(i)}
                        className={cn(
                          "h-2 rounded-full transition-all",
                          i === photoIndex ? "w-6 bg-white" : "w-2 bg-secondary/300 hover:bg-white/70"
                        )}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <h3 className="text-base font-semibold flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-400" />
            Reviews ({reviews.length})
            {avgRating > 0 && (
              <span className="text-sm text-muted-foreground font-normal">
                · {avgRating.toFixed(1)} avg rating
              </span>
            )}
          </h3>

          {isAuthenticated && (
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <button key={i} onClick={() => setReviewRating(i + 1)}>
                    <Star
                      className={cn(
                        "h-5 w-5 transition-colors",
                        i < reviewRating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30"
                      )}
                    />
                  </button>
                ))}
                <span className="text-xs text-muted-foreground ml-2">
                  {reviewRating}/5
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Write a review..."
                  className="flex-1 h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <Button
                  size="icon"
                  onClick={handleSubmitReview}
                  disabled={!reviewText.trim() || submittingReview}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No reviews yet. Be the first to review!
            </p>
          ) : (
            <div className="space-y-3">
              {reviews.map((review: any) => (
                <div key={review.id} className="rounded-xl border border-border bg-card p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {review.user && (
                        <>
                          <Avatar className="h-7 w-7">
                            <AvatarImage src={review.user.avatar} alt={review.user.name} />
                            <AvatarFallback>{review.user.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{review.user.name}</p>
                            <p className="text-[10px] text-muted-foreground">{formatRelativeTime(review.createdAt)}</p>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "h-3.5 w-3.5",
                            i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-muted-foreground">{review.comment}</p>
                  )}
                  {review.wouldRecommend && (
                    <div className="flex items-center gap-1 text-xs text-emerald-500">
                      <ThumbsUp className="h-3 w-3" /> Would recommend
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {nearbyRoutes.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="text-base font-semibold flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Nearby Routes
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {nearbyRoutes.slice(0, 4).map((nr: any) => (
                <Link key={nr.id} href={`/routes/${nr.id}`}>
                  <div className="rounded-xl border border-border bg-card p-4 hover:border-primary/20 transition-colors">
                    <p className="text-sm font-medium line-clamp-1">{nr.title}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span>{formatDistance(nr.distance)}</span>
                      <span>{nr.distanceFromUser} km away</span>
                      <Badge variant="secondary" className="text-[10px] capitalize">{nr.difficulty}</Badge>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function RouteMapCanvas({ geometry }: { geometry: RoutePoint[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || geometry.length < 2) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const padding = 30;

    const lats = geometry.map((p: RoutePoint) => p.lat);
    const lngs = geometry.map((p: RoutePoint) => p.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const latRange = maxLat - minLat || 0.001;
    const lngRange = maxLng - minLng || 0.001;
    const scale = Math.min((w - padding * 2) / lngRange, (h - padding * 2) / latRange);

    const centerX = w / 2;
    const centerY = h / 2;
    const midLng = (minLng + maxLng) / 2;
    const midLat = (minLat + maxLat) / 2;

    ctx.fillStyle = "hsl(240, 10%, 6%)";
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "#FF5A1F";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.shadowColor = "rgba(255, 90, 31, 0.3)";
    ctx.shadowBlur = 10;

    ctx.beginPath();
    geometry.forEach((point: RoutePoint, i: number) => {
      const x = centerX + (point.lng - midLng) * scale;
      const y = centerY - (point.lat - midLat) * scale;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    ctx.shadowBlur = 0;
    const start = geometry[0];
    const end = geometry[geometry.length - 1];
    const sx = centerX + (start.lng - midLng) * scale;
    const sy = centerY - (start.lat - midLat) * scale;
    const ex = centerX + (end.lng - midLng) * scale;
    const ey = centerY - (end.lat - midLat) * scale;

    ctx.fillStyle = "#22c55e";
    ctx.beginPath();
    ctx.arc(sx, sy, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.arc(ex, ey, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = "11px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("🟢 Start", 10, 20);
    ctx.fillText("🔴 End", 10, 36);
  }, [geometry]);

  if (geometry.length < 2) {
    return (
      <div className="w-full h-full flex items-center justify-center text-muted-foreground/40">
        <p className="text-sm">Route geometry not available</p>
      </div>
    );
  }

  return <canvas ref={canvasRef} className="w-full h-full" />;
}


