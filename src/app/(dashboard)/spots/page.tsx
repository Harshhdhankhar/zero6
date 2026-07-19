"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  MapPin,
  Star,
  TreePine,
  Waves,
  Mountain,
  Building,
  Route,
  SlidersHorizontal,
} from "lucide-react";
import { useFetch } from "@/hooks/use-fetch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Spot {
  id: string;
  name: string;
  description: string;
  coverPhotoUrl: string | null;
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  spotType: string;
  popularityScore: number;
  averageRating: number;
  totalRuns: number;
  totalRunners: number;
  facilityCount: number;
  reviewCount: number;
  isVerified: boolean;
  tags: string[];
}

const SPOT_TYPES = [
  "all", "park", "track", "trail", "waterfront", "stadium", "neighborhood", "forest", "beach", "hill",
];

const TYPE_ICONS: Record<string, React.ElementType> = {
  park: TreePine,
  waterfront: Waves,
  trail: Mountain,
  forest: Mountain,
  beach: Waves,
  track: Route,
  stadium: Building,
  neighborhood: Building,
  hill: Mountain,
};

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
      <Skeleton className="h-36 w-full rounded-xl" />
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border">
        <Skeleton className="h-8 rounded-lg" />
        <Skeleton className="h-8 rounded-lg" />
        <Skeleton className="h-8 rounded-lg" />
      </div>
    </div>
  );
}

export default function SpotsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const { data: spots, loading } = useFetch<Spot[]>("/api/spots?limit=50");

  const allSpots = spots || [];

  const cities = useMemo(() => {
    const set = new Set(allSpots.map((s) => s.city).filter(Boolean));
    return Array.from(set).sort();
  }, [allSpots]);

  const filtered = useMemo(() => {
    let result = allSpots;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.name?.toLowerCase().includes(q) ||
          s.city?.toLowerCase().includes(q) ||
          s.description?.toLowerCase().includes(q)
      );
    }
    if (cityFilter) {
      result = result.filter((s) => s.city === cityFilter);
    }
    if (typeFilter !== "all") {
      result = result.filter((s) => s.spotType === typeFilter);
    }
    return result;
  }, [allSpots, searchQuery, cityFilter, typeFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Running Spots</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Discover popular running spots across India
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search spots by name, city..."
          className="w-full rounded-xl border border-border bg-card px-10 py-3 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary/20 placeholder:text-muted-foreground"
        />
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 transition-colors cursor-pointer",
            showFilters ? "bg-primary text-white" : "bg-secondary text-muted-foreground hover:text-foreground"
          )}
        >
          <SlidersHorizontal className="h-4 w-4" />
        </button>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Filters
                </p>
                <button
                  onClick={() => { setCityFilter(""); setTypeFilter("all"); }}
                  className="text-xs text-primary hover:underline cursor-pointer"
                >
                  Reset
                </button>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">City</p>
                <div className="flex flex-wrap gap-1.5">
                  {cities.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCityFilter(c === cityFilter ? "" : c)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer",
                        cityFilter === c
                          ? "bg-primary text-white"
                          : "bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary"
                      )}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Type</p>
                <div className="flex flex-wrap gap-1.5">
                  {SPOT_TYPES.map((type) => (
                    <button
                      key={type}
                      onClick={() => setTypeFilter(type)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer",
                        typeFilter === type
                          ? "bg-primary text-white"
                          : "bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary"
                      )}
                    >
                      {type === "all" ? "All Types" : type.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <MapPin className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            No spots found{searchQuery ? ` for "${searchQuery}"` : ""}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((spot) => {
            const Icon = TYPE_ICONS[spot.spotType] || MapPin;
            return (
              <Link href={`/spots/${spot.id}`} key={spot.id}>
                <div className="group rounded-2xl border border-border bg-card transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 hover:-translate-y-0.5 overflow-hidden">
                  <div className="h-36 bg-gradient-to-br from-secondary to-muted flex items-center justify-center relative">
                    {spot.coverPhotoUrl ? (
                      <img
                        src={spot.coverPhotoUrl}
                        alt={spot.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Icon className="h-10 w-10 text-muted-foreground/30" />
                    )}
                    <div className="absolute top-3 left-3 flex gap-1.5">
                      {spot.isVerified && (
                        <Badge className="bg-emerald-500/80 text-white border-0 text-[10px]">
                          Verified
                        </Badge>
                      )}
                      {spot.popularityScore > 70 && (
                        <Badge className="bg-primary/80 text-white border-0 text-[10px]">
                          Popular
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-sm truncate">{spot.name}</h3>
                      <div className="flex items-center gap-1 text-xs text-yellow-500 shrink-0 ml-2">
                        <Star className="h-3 w-3" />
                        {spot.averageRating?.toFixed(1) || "—"}
                      </div>
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {spot.city || "Unknown"}
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
                      {spot.description || "No description available"}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      <Badge variant="secondary" className="text-[10px] capitalize">
                        {spot.spotType?.replace("_", " ")}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {spot.facilityCount} facilities
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {spot.reviewCount} reviews
                      </Badge>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border pt-3">
                      <div className="text-center">
                        <p className="text-sm font-bold">{spot.totalRuns || 0}</p>
                        <p className="text-[10px] text-muted-foreground">Runs</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold">{spot.totalRunners || 0}</p>
                        <p className="text-[10px] text-muted-foreground">Runners</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold">{spot.popularityScore?.toFixed(0) || 0}%</p>
                        <p className="text-[10px] text-muted-foreground">Popular</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
