"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  Map, Route, Navigation, Search, ChevronRight,
  Calendar, X, LogIn,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { useFetch } from "@/hooks/use-fetch";
import { formatDistance, formatDuration } from "@/lib/utils";

const MapboxMap = dynamic(
  () => import("@/components/maps/mapbox-map").then((m) => ({ default: m.MapboxMap })),
  { ssr: false }
);

const RoutesLayerComponent = dynamic(
  () => import("@/components/maps/routes-layer").then((m) => ({ default: m.RoutesLayer })),
  { ssr: false }
);

const SpotsLayerComponent = dynamic(
  () => import("@/components/maps/spots-layer").then((m) => ({ default: m.SpotsLayer })),
  { ssr: false }
);

const EventsLayerComponent = dynamic(
  () => import("@/components/maps/events-layer").then((m) => ({ default: m.EventsLayer })),
  { ssr: false }
);

const ClubsLayerComponent = dynamic(
  () => import("@/components/maps/clubs-layer").then((m) => ({ default: m.ClubsLayer })),
  { ssr: false }
);

interface RouteData {
  id: string; title: string; distance: number; elevation_gain: number;
  difficulty: string; geometry: { lat: number; lng: number }[];
  city: string; estimated_duration?: number; user_name?: string;
}

type FilterKey = "all" | "5k" | "10k" | "long";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "5k", label: "5K" },
  { key: "10k", label: "10K" },
  { key: "long", label: "Long Run" },
];

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  moderate: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  hard: "text-red-400 border-red-500/30 bg-red-500/10",
};

const LOGIN_REDIRECT = "/login?redirect=/map";

export default function PublicMapPage() {
  const { isAuthenticated } = useAuth();
  const [center, setCenter] = useState<[number, number]>([78.9629, 20.5937]);
  const [zoom, setZoom] = useState(4.5);
  const [targetFlyTo, setTargetFlyTo] = useState<{ center: [number, number]; zoom?: number } | undefined>(undefined);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [selectedRoute, setSelectedRoute] = useState<RouteData | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobilePanel, setShowMobilePanel] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const { data: routes } = useFetch<RouteData[]>("/api/routes?limit=50");

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const filteredRoutes = useMemo(() => {
    if (!routes) return [];
    return routes.filter((r) => {
      if (activeFilter === "all") return true;
      if (activeFilter === "5k") return r.distance > 0 && r.distance <= 6000;
      if (activeFilter === "10k") return r.distance > 6000 && r.distance <= 15000;
      if (activeFilter === "long") return r.distance > 15000;
      return true;
    });
  }, [routes, activeFilter]);

  const topRoutes = useMemo(() => {
    return [...filteredRoutes]
      .sort((a, b) => (a.distance || 0) - (b.distance || 0))
      .slice(0, 20);
  }, [filteredRoutes]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleMapReady = useCallback((map: any) => {
    setMapInstance(map);
  }, []);

  const triggerFlyTo = useCallback((c: [number, number], z?: number) => {
    setTargetFlyTo({ center: c, zoom: z || 14 });
  }, []);

  const handleRouteClick = useCallback((route: RouteData) => {
    setSelectedRoute(route);
    if (route.geometry?.length) {
      const mid = route.geometry[Math.floor(route.geometry.length / 2)];
      triggerFlyTo([mid.lng, mid.lat], 13);
    }
  }, [triggerFlyTo]);

  const handleSelectRoute = useCallback((route: RouteData) => {
    setSelectedRoute(route);
    if (route.geometry?.length) {
      const mid = route.geometry[Math.floor(route.geometry.length / 2)];
      triggerFlyTo([mid.lng, mid.lat], 13);
    }
    if (isMobile) setShowMobilePanel(true);
  }, [triggerFlyTo, isMobile]);

  const requireAuth = useCallback(() => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return false;
    }
    return true;
  }, [isAuthenticated]);

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-background">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-background/90 to-transparent pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center font-black text-[9px]">Z6</div>
            <span className="font-bold text-sm tracking-tight hidden sm:inline">ZERO<span className="text-primary">6</span></span>
          </Link>
          <div className="hidden sm:flex items-center gap-1 ml-4 text-[11px] text-muted-foreground/60">
            <Map className="w-3.5 h-3.5" />
            <span>Running Map</span>
          </div>
        </div>

        <div className="pointer-events-auto" />
      </div>

      {/* Desktop left panel */}
      <div className="absolute top-14 left-3 bottom-3 w-64 z-10 hidden md:flex flex-col gap-2 pointer-events-none">
        <div className="pointer-events-auto bg-background/90 backdrop-blur-xl border border-border/30 rounded-xl p-3.5 shadow-2xl flex-1 overflow-hidden flex flex-col">
          <div className="flex items-center mb-3">
            <span className="text-xs font-semibold text-muted-foreground">Routes</span>
          </div>

          <div className="flex gap-1.5 mb-3">
            {FILTERS.map((f) => (
              <button key={f.key}
                onClick={() => { setActiveFilter(f.key); setSelectedRoute(null); }}
                className={`text-[10px] font-medium px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                  activeFilter === f.key
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border/50 text-muted-foreground/70 hover:border-primary/30 hover:text-white"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex-1 space-y-1 overflow-y-auto custom-scrollbar">
            {!routes && (
              <div className="flex items-center gap-2 py-6 text-xs text-muted-foreground justify-center">
                <div className="animate-spin w-3 h-3 border border-primary border-t-transparent rounded-full" />
                Loading...
              </div>
            )}
            {routes && topRoutes.length === 0 && (
              <div className="py-6 text-center">
                <Route className="w-5 h-5 mx-auto mb-2 text-muted-foreground/30" />
                <p className="text-xs text-muted-foreground/60">No routes yet</p>
              </div>
            )}
            {topRoutes.map((route) => (
              <button key={route.id}
                onClick={() => handleSelectRoute(route)}
                className={`w-full text-left flex items-center gap-2.5 p-2 rounded-lg transition-all cursor-pointer ${
                  selectedRoute?.id === route.id
                    ? "bg-primary/10 border border-primary/20"
                    : "hover:bg-white/[0.04] border border-transparent"
                }`}
              >
                <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                  <Route className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">{route.title}</div>
                  <div className="flex items-center gap-2 text-[9px] text-muted-foreground/60">
                    <span>{formatDistance(route.distance)}</span>
                    {route.elevation_gain > 0 && <span>{route.elevation_gain}m ↑</span>}
                    {route.difficulty && (
                      <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-medium border ${
                        DIFFICULTY_COLORS[route.difficulty] || "text-muted-foreground/60 border-border/30"
                      }`}>
                        {route.difficulty}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>


      </div>

      {/* Route detail card */}
      <AnimatePresence>
        {selectedRoute && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="absolute bottom-3 left-3 right-3 z-10 pointer-events-none"
          >
            <div className="pointer-events-auto max-w-lg mx-auto md:mx-0 md:ml-[270px] bg-background/95 backdrop-blur-2xl border border-border/30 rounded-xl p-4 shadow-2xl">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Route className="w-3.5 h-3.5 text-primary shrink-0" />
                    <h4 className="text-sm font-bold truncate">{selectedRoute.title}</h4>
                  </div>
                </div>
                <button onClick={() => setSelectedRoute(null)}
                  className="w-6 h-6 rounded-full bg-card/60 flex items-center justify-center hover:bg-card transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-3 h-3 text-muted-foreground" />
                </button>
              </div>

              <div className="flex items-center gap-3 text-[10px] text-muted-foreground/70 mb-3 flex-wrap">
                <span className="flex items-center gap-1">
                  <Navigation className="w-3 h-3" />
                  {formatDistance(selectedRoute.distance)}
                </span>
                {selectedRoute.elevation_gain > 0 && (
                  <span className="flex items-center gap-1">
                    <Navigation className="w-3 h-3" />
                    {selectedRoute.elevation_gain}m
                  </span>
                )}
                {selectedRoute.estimated_duration && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDuration(selectedRoute.estimated_duration)}
                  </span>
                )}
                {selectedRoute.difficulty && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-medium border ${
                    DIFFICULTY_COLORS[selectedRoute.difficulty] || "text-muted-foreground/60 border-border/30"
                  }`}>
                    {selectedRoute.difficulty}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => { if (requireAuth()) window.location.href = `/routes/${selectedRoute.id}`; }}
                  className="flex items-center gap-1 text-[11px] font-semibold px-3.5 py-1.5 rounded-full bg-primary text-primary-foreground hover:shadow-[0_0_20px_var(--primary-glow)] transition-all cursor-pointer"
                >
                  View Route <ChevronRight className="w-3 h-3" />
                </button>
                <button onClick={() => { requireAuth(); }}
                  className="flex items-center gap-1 text-[11px] font-medium px-3.5 py-1.5 rounded-full border border-border/40 text-muted-foreground/70 hover:text-white hover:border-white/30 transition-all cursor-pointer"
                >
                  Save Route
                </button>
                {selectedRoute.city && (
                  <span className="text-[10px] text-muted-foreground/40 ml-auto">
                    {selectedRoute.city}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile bottom trigger */}
      {isMobile && !selectedRoute && (
        <div className="absolute bottom-3 left-3 right-3 z-10">
          <button onClick={() => setShowMobilePanel(!showMobilePanel)}
            className="w-full bg-background/95 backdrop-blur-2xl border border-border/30 rounded-xl p-3.5 shadow-2xl flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium">Explore routes</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      )}

      {/* Mobile panel */}
      <AnimatePresence>
        {isMobile && showMobilePanel && !selectedRoute && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute inset-x-0 bottom-0 top-[35%] z-20 bg-background/98 backdrop-blur-2xl border-t border-border/30 rounded-t-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 pb-2">
              <span className="text-sm font-bold">Routes</span>
              <button onClick={() => setShowMobilePanel(false)}
                className="w-7 h-7 rounded-full bg-card/60 flex items-center justify-center cursor-pointer"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>

            <div className="px-4 pb-2 flex gap-1.5 overflow-x-auto">
              {FILTERS.map((f) => (
                <button key={f.key}
                  onClick={() => setActiveFilter(f.key)}
                  className={`text-[10px] font-medium px-3 py-1.5 rounded-full border whitespace-nowrap transition-all cursor-pointer ${
                    activeFilter === f.key
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border/50 text-muted-foreground/70"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="px-4 pb-4 space-y-1 overflow-y-auto" style={{ maxHeight: "calc(100% - 100px)" }}>
              {topRoutes.length === 0 && (
                <div className="py-8 text-center">
                  <Route className="w-6 h-6 mx-auto mb-2 text-muted-foreground/20" />
                  <p className="text-xs text-muted-foreground/60">No routes yet</p>
                </div>
              )}
              {topRoutes.map((route) => (
                <button key={route.id}
                  onClick={() => handleSelectRoute(route)}
                  className="w-full text-left flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.03] transition-all cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                    <Route className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{route.title}</div>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60">
                      <span>{formatDistance(route.distance)}</span>
                      {route.elevation_gain > 0 && <span>{route.elevation_gain}m ↑</span>}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/30 shrink-0" />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auth required modal */}
      <AnimatePresence>
        {showAuthModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border/50 rounded-2xl p-6 shadow-2xl max-w-sm w-full mx-4 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <LogIn className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold mb-2">Sign in to continue</h3>
              <p className="text-sm text-muted-foreground/70 mb-6">
                Create an account or sign in to save routes, join runs, and register for events.
              </p>
              <div className="flex flex-col gap-2">
                <Link href={LOGIN_REDIRECT}
                  className="w-full py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:shadow-[0_0_30px_var(--primary-glow)] transition-all"
                >
                  Sign In
                </Link>
                <Link href={`/signup?redirect=/map`}
                  className="w-full py-2.5 rounded-full border border-border/50 text-sm font-medium text-muted-foreground hover:text-white hover:border-white/30 transition-all"
                >
                  Create Account
                </Link>
                <button onClick={() => setShowAuthModal(false)}
                  className="text-xs text-muted-foreground/50 hover:text-muted-foreground pt-2 cursor-pointer"
                >
                  Continue browsing
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map */}
      <div className="absolute inset-0">
        <MapboxMap
          center={center}
          zoom={zoom}
          onMoveEnd={(c, z) => { setCenter(c); setZoom(z); }}
          onMapReady={handleMapReady}
          className="h-full w-full"
          flyTo={targetFlyTo}
        />

        {/* Maplibre layers */}
        {mapInstance && (
          <>
            <RoutesLayerComponent map={mapInstance} active={true} onRouteClick={handleRouteClick} />
            <SpotsLayerComponent map={mapInstance} active={true} />
            <EventsLayerComponent map={mapInstance} active={true} />
            <ClubsLayerComponent map={mapInstance} active={true} />
          </>
        )}
      </div>
    </div>
  );
}
