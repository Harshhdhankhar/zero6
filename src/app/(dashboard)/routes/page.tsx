"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, SlidersHorizontal, Search, Sparkles, MapPin, TrendingUp } from "lucide-react";
import { useFetch } from "@/hooks/use-fetch";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { RouteCard, RouteCardSkeleton } from "@/components/routes/route-card";
import { RouteList } from "@/components/routes/route-list";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RouteBuilder } from "@/components/routes/route-builder";
import type { Route, RoutePoint } from "@/types";

const DIFFICULTIES = ["all", "easy", "moderate", "hard", "extreme"];
const SURFACE_TYPES = ["all", "road", "trail", "track", "park", "mixed"];
const SORT_OPTIONS = [
  { value: "recent", label: "Most Recent" },
  { value: "popular", label: "Most Popular" },
  { value: "rating", label: "Highest Rated" },
];

export default function RoutesPage() {
  const { isAuthenticated } = useAuth();
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [surfaceFilter, setSurfaceFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [minDist, setMinDist] = useState("");
  const [maxDist, setMaxDist] = useState("");
  const [showBuilder, setShowBuilder] = useState(false);

  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", "12");
  params.set("sort", sortBy);
  if (searchQuery) params.set("city", searchQuery);
  if (difficultyFilter !== "all") params.set("difficulty", difficultyFilter);
  if (surfaceFilter !== "all") params.set("surfaceType", surfaceFilter);
  if (minDist) params.set("minDistance", String(parseFloat(minDist) * 1000));
  if (maxDist) params.set("maxDistance", String(parseFloat(maxDist) * 1000));

  const { data, loading, refetch } = useFetch<{
    data: Route[];
    meta: { total: number; page: number; limit: number };
  }>(`/api/routes?${params.toString()}`);

  const routes = data?.data || [];
  const meta = data?.meta || { total: 0, page: 1, limit: 12 };

  const { data: recsData, loading: recsLoading } = useFetch<{
    personalized: Route[];
    nearby: Route[];
    popular: Route[];
  }>(isAuthenticated ? "/api/routes/recommendations" : "");

  const handleBookmark = useCallback(async (routeId: string) => {
    try {
      await fetch(`/api/routes/${routeId}/bookmark`, { method: "POST" });
      refetch();
    } catch {}
  }, [refetch]);

  const handleSaveRoute = useCallback(async (routeData: {
    title: string;
    description?: string;
    distance: number;
    elevationGain: number;
    difficulty: string;
    surfaceType: string;
    routeType: string;
    geometry: RoutePoint[];
    city?: string;
    tags: string[];
  }) => {
    try {
      const res = await fetch("/api/routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(routeData),
      });
      if (res.ok) {
        setShowBuilder(false);
        refetch();
      }
    } catch {}
  }, [refetch]);

  const resetFilters = () => {
    setSearchQuery("");
    setDifficultyFilter("all");
    setSurfaceFilter("all");
    setSortBy("recent");
    setMinDist("");
    setMaxDist("");
    setPage(1);
  };

  const hasFilters = searchQuery || difficultyFilter !== "all" || surfaceFilter !== "all" || minDist || maxDist;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Routes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Discover running routes
          </p>
        </div>
        <Dialog open={showBuilder} onOpenChange={setShowBuilder}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Build Route
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Build a Route</DialogTitle>
            </DialogHeader>
            <RouteBuilder
              onSave={handleSaveRoute}
              onClose={() => setShowBuilder(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {isAuthenticated && recsData && !recsLoading && (
        <div className="space-y-6">
          {recsData.personalized && recsData.personalized.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold flex items-center gap-1.5">
                  Recommended for You
                  <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                    AI
                  </Badge>
                </h2>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
                {recsData.personalized.map((route) => (
                  <div key={route.id} className="w-64 shrink-0">
                    <RouteCard route={route} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {recsData.nearby && recsData.nearby.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="h-4 w-4 text-emerald-400" />
                <h2 className="text-sm font-semibold flex items-center gap-1.5">
                  Nearby Routes
                  <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                    AI
                  </Badge>
                </h2>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
                {recsData.nearby.map((route) => (
                  <div key={route.id} className="w-64 shrink-0">
                    <RouteCard route={route} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {recsData.popular && recsData.popular.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-orange-400" />
                <h2 className="text-sm font-semibold flex items-center gap-1.5">
                  Popular Routes
                  <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                    AI
                  </Badge>
                </h2>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
                {recsData.popular.map((route) => (
                  <div key={route.id} className="w-64 shrink-0">
                    <RouteCard route={route} />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {isAuthenticated && recsLoading && (
        <div className="space-y-6">
          {["Personalized", "Nearby", "Popular"].map((section) => (
            <section key={section}>
              <div className="flex items-center gap-2 mb-3">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-4 w-32 rounded" />
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="w-64 shrink-0">
                    <RouteCardSkeleton />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
          placeholder="Search by city..."
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
            <div className="rounded-xl border border-border bg-card p-4 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Filters</p>
                {hasFilters && (
                  <button onClick={resetFilters} className="text-xs text-primary hover:underline cursor-pointer">
                    Reset all
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Difficulty</label>
                  <div className="flex flex-wrap gap-1.5">
                    {DIFFICULTIES.map((d) => (
                      <button
                        key={d}
                        onClick={() => { setDifficultyFilter(d); setPage(1); }}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer capitalize",
                          difficultyFilter === d
                            ? "bg-primary text-white"
                            : "bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary"
                        )}
                      >
                        {d === "all" ? "All" : d}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Surface</label>
                  <div className="flex flex-wrap gap-1.5">
                    {SURFACE_TYPES.map((s) => (
                      <button
                        key={s}
                        onClick={() => { setSurfaceFilter(s); setPage(1); }}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer capitalize",
                          surfaceFilter === s
                            ? "bg-primary text-white"
                            : "bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary"
                        )}
                      >
                        {s === "all" ? "All" : s}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Distance Range (km)
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={minDist}
                      onChange={(e) => { setMinDist(e.target.value); setPage(1); }}
                      className="h-8 text-xs"
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={maxDist}
                      onChange={(e) => { setMaxDist(e.target.value); setPage(1); }}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                    className="w-full h-8 rounded-lg border border-input bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <RouteList
        routes={routes}
        loading={loading}
        total={meta.total}
        page={meta.page}
        limit={meta.limit}
        onPageChange={setPage}
        onBookmark={handleBookmark}
      />
    </div>
  );
}
