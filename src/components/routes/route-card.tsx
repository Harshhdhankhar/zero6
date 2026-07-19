"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  MapPin,
  Mountain,
  Route,
  Bookmark,
  Heart,
  Star,
  ImageIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn, formatDistance } from "@/lib/utils";
import type { Route as RouteType } from "@/types";

const difficultyColors: Record<string, string> = {
  easy: "bg-emerald-500/15 text-emerald-500 border-emerald-500/20",
  moderate: "bg-amber-500/15 text-amber-500 border-amber-500/20",
  hard: "bg-orange-500/15 text-orange-500 border-orange-500/20",
  extreme: "bg-red-500/15 text-red-500 border-red-500/20",
};

const surfaceIcons: Record<string, string> = {
  road: "🛣️",
  trail: "🌲",
  track: "🏟️",
  park: "🌳",
  mixed: "🔀",
  treadmill: "🏃",
};

export interface RouteCardProps {
  route: RouteType;
  onBookmark?: (routeId: string) => void;
  className?: string;
}

export function RouteCard({ route, onBookmark, className }: RouteCardProps) {
  const hasImage = route.photos && route.photos.length > 0;
  const imageUrl = hasImage ? route.photos![0].thumbnailUrl || route.photos![0].url : null;
  const avgRating = route.statistics?.averageRating || 0;
  const bookmarkCount = route.statistics?.bookmarkCount || 0;
  const difficultyLabel = route.difficulty.charAt(0).toUpperCase() + route.difficulty.slice(1);

  return (
    <Link href={`/routes/${route.id}`}>
      <motion.div
        whileHover={{ y: -4 }}
        className={cn(
          "group rounded-2xl border border-border bg-card overflow-hidden transition-all duration-300",
          "hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20",
          className
        )}
      >
        <div className="relative h-40 bg-gradient-to-br from-secondary to-muted flex items-center justify-center overflow-hidden">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={route.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground/40">
              <ImageIcon className="h-10 w-10" />
              <span className="text-xs">No photo</span>
            </div>
          )}
          <Badge
            className={cn(
              "absolute top-3 left-3 border text-[10px] px-2 py-0.5",
              difficultyColors[route.difficulty]
            )}
          >
            {difficultyLabel}
          </Badge>
          {avgRating > 0 && (
            <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-full px-2 py-0.5 text-xs">
              <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
              <span className="text-white">{avgRating.toFixed(1)}</span>
            </div>
          )}
        </div>

        <div className="p-4 space-y-3">
          <div>
            <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">
              {route.title}
            </h3>
            {route.city && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <MapPin className="h-3 w-3" />
                {route.city}
                {route.state && `, ${route.state}`}
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg bg-secondary/50 p-2 text-center">
              <p className="text-xs font-bold">{formatDistance(route.distance)}</p>
              <p className="text-[10px] text-muted-foreground">Dist</p>
            </div>
            <div className="rounded-lg bg-secondary/50 p-2 text-center">
              <div className="flex items-center justify-center gap-0.5">
                <Mountain className="h-3 w-3 text-muted-foreground" />
                <p className="text-xs font-bold">{(route.elevationGain || 0).toFixed(0)}m</p>
              </div>
              <p className="text-[10px] text-muted-foreground">Elev</p>
            </div>
            <div className="rounded-lg bg-secondary/50 p-2 text-center">
              <p className="text-xs">{surfaceIcons[route.surfaceType] || "🛣️"}</p>
              <p className="text-[10px] text-muted-foreground capitalize">
                {route.surfaceType}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-border">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Route className="h-3 w-3" />
                {route.routeType === "out-and-back" ? "Out & Back" : route.routeType.charAt(0).toUpperCase() + route.routeType.slice(1)}
              </span>
              <span className="flex items-center gap-1">
                <Bookmark className="h-3 w-3" />
                {bookmarkCount}
              </span>
            </div>
            {onBookmark && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onBookmark(route.id);
                }}
                className="p-1.5 rounded-full hover:bg-secondary/80 transition-colors"
              >
                <Heart
                  className={cn(
                    "h-4 w-4 transition-colors",
                    route.isBookmarked ? "fill-red-500 text-red-500" : "text-muted-foreground"
                  )}
                />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

export function RouteCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden animate-pulse">
      <div className="h-40 bg-secondary" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-secondary rounded w-3/4" />
        <div className="h-3 bg-secondary rounded w-1/2" />
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 bg-secondary rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
