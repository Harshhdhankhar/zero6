"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { formatDistance, formatDuration } from "@/lib/utils";
import { MapPin, Route, ArrowRight, ChevronRight, Search, Navigation, Clock, TrendingUp, Users, X } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface StaticRoute {
  id: string;
  title: string;
  distance: number;
  elevation_gain: number;
  difficulty: string;
  surface_type: string;
  geometry: { lat: number; lng: number }[];
  city: string;
  average_rating?: number;
  estimated_duration?: number;
  community_name?: string;
}

interface StaticClub {
  id: string;
  name: string;
  location: string;
}

type FilterKey = "all" | "5k" | "10k" | "long";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All Routes" },
  { key: "5k", label: "5K" },
  { key: "10k", label: "10K" },
  { key: "long", label: "Long Run" },
];

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  moderate: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  hard: "text-red-400 border-red-500/30 bg-red-500/10",
};

const STATIC_ROUTES: StaticRoute[] = [
  {
    id: "route-1", title: "Lodhi Garden Loop",
    distance: 5200, elevation_gain: 45, difficulty: "easy", surface_type: "trail",
    geometry: [
      { lat: 28.5931, lng: 77.2197 }, { lat: 28.5910, lng: 77.2210 },
      { lat: 28.5895, lng: 77.2230 }, { lat: 28.5880, lng: 77.2245 },
      { lat: 28.5870, lng: 77.2220 }, { lat: 28.5885, lng: 77.2195 },
      { lat: 28.5905, lng: 77.2185 }, { lat: 28.5931, lng: 77.2197 },
    ],
    city: "Delhi", average_rating: 4.5, estimated_duration: 2100, community_name: "Delhi Run Collective",
  },
  {
    id: "route-2", title: "Marine Drive 10K",
    distance: 10000, elevation_gain: 30, difficulty: "easy", surface_type: "road",
    geometry: [
      { lat: 18.9430, lng: 72.8230 }, { lat: 18.9480, lng: 72.8210 },
      { lat: 18.9540, lng: 72.8190 }, { lat: 18.9600, lng: 72.8170 },
      { lat: 18.9650, lng: 72.8150 }, { lat: 18.9700, lng: 72.8130 },
      { lat: 18.9650, lng: 72.8150 }, { lat: 18.9600, lng: 72.8170 },
      { lat: 18.9540, lng: 72.8190 }, { lat: 18.9480, lng: 72.8210 },
      { lat: 18.9430, lng: 72.8230 },
    ],
    city: "Mumbai", average_rating: 4.7, estimated_duration: 3600, community_name: "Marine Drive Runners",
  },
  {
    id: "route-3", title: "Cubbon Park Morning Route",
    distance: 4500, elevation_gain: 25, difficulty: "easy", surface_type: "trail",
    geometry: [
      { lat: 12.9760, lng: 77.5920 }, { lat: 12.9785, lng: 77.5940 },
      { lat: 12.9800, lng: 77.5965 }, { lat: 12.9790, lng: 77.5990 },
      { lat: 12.9765, lng: 77.6000 }, { lat: 12.9740, lng: 77.5985 },
      { lat: 12.9730, lng: 77.5955 }, { lat: 12.9745, lng: 77.5930 },
      { lat: 12.9760, lng: 77.5920 },
    ],
    city: "Bengaluru", average_rating: 4.6, estimated_duration: 1800, community_name: "Cubbon Park Crew",
  },
  {
    id: "route-4", title: "KBR Park Trail",
    distance: 7200, elevation_gain: 60, difficulty: "moderate", surface_type: "trail",
    geometry: [
      { lat: 17.4120, lng: 78.4550 }, { lat: 17.4150, lng: 78.4565 },
      { lat: 17.4180, lng: 78.4580 }, { lat: 17.4160, lng: 78.4610 },
      { lat: 17.4130, lng: 78.4600 }, { lat: 17.4100, lng: 78.4575 },
      { lat: 17.4120, lng: 78.4550 },
    ],
    city: "Hyderabad", average_rating: 4.3, estimated_duration: 3000, community_name: "Hyderabad Trail Society",
  },
  {
    id: "route-5", title: "Koregaon Park 5K",
    distance: 5000, elevation_gain: 20, difficulty: "easy", surface_type: "road",
    geometry: [
      { lat: 18.5360, lng: 73.8890 }, { lat: 18.5385, lng: 73.8910 },
      { lat: 18.5400, lng: 73.8930 }, { lat: 18.5390, lng: 73.8960 },
      { lat: 18.5365, lng: 73.8945 }, { lat: 18.5350, lng: 73.8915 },
      { lat: 18.5360, lng: 73.8890 },
    ],
    city: "Pune", average_rating: 4.4, estimated_duration: 1800, community_name: "Pune Pacemakers",
  },
];

const STATIC_CLUBS: StaticClub[] = [
  { id: "c-1", name: "Delhi Run Collective", location: "Lodhi Garden, Delhi" },
  { id: "c-2", name: "Marine Drive Runners", location: "Marine Drive, Mumbai" },
  { id: "c-3", name: "Cubbon Park Crew", location: "Cubbon Park, Bengaluru" },
  { id: "c-4", name: "Hyderabad Trail Society", location: "KBR Park, Hyderabad" },
];

export function LandingMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [selectedRoute, setSelectedRoute] = useState<StaticRoute | null>(null);
  const [showMobilePanel, setShowMobilePanel] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => { const v = window.innerWidth < 768; setIsMobile(v); };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const filteredRoutes = useMemo(() => {
    return STATIC_ROUTES.filter((r) => {
      if (activeFilter === "all") return true;
      if (activeFilter === "5k") return r.distance > 0 && r.distance <= 6000;
      if (activeFilter === "10k") return r.distance > 6000 && r.distance <= 15000;
      if (activeFilter === "long") return r.distance > 15000;
      return true;
    });
  }, [activeFilter]);

  const topRoutes = useMemo(() => {
    return [...filteredRoutes]
      .sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0))
      .slice(0, 10);
  }, [filteredRoutes]);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let mapInstance: any = null;

    async function initMap() {
      if (!mapContainerRef.current) return;

      try {
        const mod = await import("maplibre-gl");
        if (cancelled) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mlgl: any = mod.default || mod;
        const style = process.env.NEXT_PUBLIC_MAP_STYLE || "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const map: any = new mlgl.Map({
          container: mapContainerRef.current,
          style,
          center: [78.9629, 22.5937],
          zoom: 4.5,
          attributionControl: false,
          interactive: true,
        });

        map.addControl(new mlgl.NavigationControl(), "bottom-right");

        map.on("load", () => {
          if (cancelled) return;
          setMapReady(true);
          mapInstance = map;
          mapRef.current = map;
          map.resize();
          setMapError(null);
        });

        map.on("error", () => {});

        map.on("click", (e: { point: { x: number; y: number } }) => {
          const features = map.queryRenderedFeatures(e.point, { layers: ["routes-line"] });
          if (features?.length) {
            const props = features[0].properties;
            const route = STATIC_ROUTES.find((r) => r.id === props.id);
            if (route) {
              setSelectedRoute(route);
              if (window.innerWidth < 768) setShowMobilePanel(true);
            }
          }
        });

        map.on("mouseenter", "routes-line", () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", "routes-line", () => {
          map.getCanvas().style.cursor = "";
        });

        mapInstance = map;
        mapRef.current = map;
      } catch (err) {
        if (!cancelled) {
          setMapError(err instanceof Error ? err.message : "Failed to load map");
        }
      }
    }

    initMap();
    return () => {
      cancelled = true;
      if (mapInstance) {
        mapInstance.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !topRoutes) return;

    const sourceId = "routes-source";
    const lineLayerId = "routes-line";
    const glowLayerId = "routes-glow";

    const features = topRoutes
      .filter((r) => r.geometry && r.geometry.length > 1)
      .map((r) => ({
        type: "Feature" as const,
        geometry: {
          type: "LineString" as const,
          coordinates: r.geometry.map((pt) => [pt.lng, pt.lat]),
        },
        properties: {
          id: r.id,
          title: r.title,
          distance: r.distance,
          elevation: r.elevation_gain,
          difficulty: r.difficulty,
        },
      }));

    try {
      const existing = map.getSource(sourceId);
      if (existing) {
        existing.setData({ type: "FeatureCollection", features });
        return;
      }

      map.addSource(sourceId, {
        type: "geojson",
        data: { type: "FeatureCollection", features },
      });

      map.addLayer({
        id: glowLayerId,
        type: "line",
        source: sourceId,
        paint: {
          "line-color": "#FF5A1F",
          "line-width": 8,
          "line-opacity": 0.15,
          "line-blur": 4,
        },
      });

      map.addLayer({
        id: lineLayerId,
        type: "line",
        source: sourceId,
        paint: {
          "line-color": "#FF5A1F",
          "line-width": [
            "interpolate", ["linear"], ["zoom"],
            10, 1.5,
            15, 4,
          ],
          "line-opacity": 0.8,
        },
      });
    } catch {}
  }, [mapReady, topRoutes]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !STATIC_CLUBS) return;

    const sourceId = "clubs-source";
    const layerId = "clubs-layer";

    const clubCoords: Record<string, [number, number]> = {
      "c-1": [77.2197, 28.5931],
      "c-2": [72.8230, 18.9430],
      "c-3": [77.5920, 12.9760],
      "c-4": [78.4550, 17.4120],
    };

    const features = STATIC_CLUBS
      .filter((c) => clubCoords[c.id])
      .map((c) => ({
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates: clubCoords[c.id],
        },
        properties: { id: c.id, name: c.name },
      }));

    if (features.length === 0) return;

    try {
      const existing = map.getSource(sourceId);
      if (existing) {
        existing.setData({ type: "FeatureCollection", features });
        return;
      }

      map.addSource(sourceId, {
        type: "geojson",
        data: { type: "FeatureCollection", features },
      });

      map.addLayer({
        id: layerId,
        type: "circle",
        source: sourceId,
        paint: {
          "circle-radius": 6,
          "circle-color": "#FF5A1F",
          "circle-opacity": 0.8,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
          "circle-stroke-opacity": 0.5,
        },
      });
    } catch {}
  }, [mapReady]);

  const handleFlyTo = useCallback((lat: number, lng: number, zoom = 13) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const map: any = mapRef.current;
    if (map) {
      map.flyTo({ center: [lng, lat], zoom, duration: 1200 });
    }
  }, []);

  const handleSelectRoute = useCallback((route: StaticRoute) => {
    setSelectedRoute(route);
    if (route.geometry?.length) {
      const mid = route.geometry[Math.floor(route.geometry.length / 2)];
      handleFlyTo(mid.lat, mid.lng, 13);
    }
    if (isMobile) setShowMobilePanel(true);
  }, [handleFlyTo, isMobile]);

  return (
    <div className="relative w-full rounded-2xl border border-border/30 overflow-hidden" style={{ minHeight: isMobile ? "450px" : "520px" }}>
      <div ref={mapContainerRef} className="absolute inset-0" />

      {mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/90 z-20">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Could not load map</p>
            <p className="text-xs text-muted-foreground/60">{mapError}</p>
          </div>
        </div>
      )}

      {!mapReady && !mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-background z-20">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="animate-spin w-4 h-4 border border-primary border-t-transparent rounded-full" />
            Loading map...
          </div>
        </div>
      )}

      {/* Left panel - desktop */}
      <div className="absolute top-3 left-3 bottom-3 w-72 z-10 hidden md:flex flex-col gap-2 pointer-events-none">
        <div className="pointer-events-auto bg-background/90 backdrop-blur-xl border border-border/30 rounded-xl p-3.5 shadow-2xl flex-1 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground">Routes</span>
            </div>
            <Link href="/map" className="text-[10px] text-primary hover:underline flex items-center gap-0.5">
              Open map <ChevronRight className="w-3 h-3" />
            </Link>
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

          <div className="space-y-1 overflow-y-auto custom-scrollbar flex-1">
            {topRoutes.length === 0 && (
              <div className="py-6 text-center">
                <Route className="w-6 h-6 mx-auto mb-2 text-muted-foreground/30" />
                <p className="text-xs text-muted-foreground/60">No routes in this range</p>
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
                        DIFFICULTY_COLORS[route.difficulty] || "text-muted-foreground/60 border-border/30 bg-card/30"
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

        {STATIC_CLUBS.length > 0 && (
          <div className="pointer-events-auto bg-background/90 backdrop-blur-xl border border-border/30 rounded-xl p-3.5 shadow-2xl">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] font-semibold text-muted-foreground">Communities</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {STATIC_CLUBS.slice(0, 4).map((c) => (
                <Link key={c.id} href="/communities"
                  className="text-[9px] px-2 py-1 rounded-full bg-card/50 border border-border/30 text-muted-foreground/70 hover:text-white hover:border-primary/30 transition-all"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Route detail card - bottom floating */}
      <AnimatePresence>
        {selectedRoute && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="absolute bottom-3 left-3 right-3 z-10 pointer-events-none"
          >
            <div className="pointer-events-auto max-w-lg mx-auto md:mx-0 bg-background/95 backdrop-blur-2xl border border-border/30 rounded-xl p-4 shadow-2xl">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Route className="w-3.5 h-3.5 text-primary shrink-0" />
                    <h4 className="text-sm font-bold truncate">{selectedRoute.title}</h4>
                  </div>
                  {selectedRoute.community_name && (
                    <p className="text-[10px] text-muted-foreground/60">{selectedRoute.community_name}</p>
                  )}
                </div>
                <button onClick={() => { setSelectedRoute(null); setShowMobilePanel(false); }}
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
                    <TrendingUp className="w-3 h-3" />
                    {selectedRoute.elevation_gain}m
                  </span>
                )}
                {selectedRoute.estimated_duration && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDuration(selectedRoute.estimated_duration)}
                  </span>
                )}
                {selectedRoute.difficulty && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-medium border ${
                    DIFFICULTY_COLORS[selectedRoute.difficulty] || "text-muted-foreground/60 border-border/30 bg-card/30"
                  }`}>
                    {selectedRoute.difficulty}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Link href="/map"
                  className="flex items-center gap-1 text-[11px] font-semibold px-3.5 py-1.5 rounded-full bg-primary text-primary-foreground hover:shadow-[0_0_20px_var(--primary-glow)] transition-all"
                >
                  View Route <ArrowRight className="w-3 h-3" />
                </Link>
                {selectedRoute.city && (
                  <button onClick={() => {
                    if (selectedRoute.geometry?.length) {
                      const c = selectedRoute.geometry[Math.floor(selectedRoute.geometry.length / 2)];
                      handleFlyTo(c.lat, c.lng, 14);
                    }
                  }}
                    className="flex items-center gap-1 text-[11px] font-medium px-3.5 py-1.5 rounded-full border border-border/40 text-muted-foreground/70 hover:text-white hover:border-white/30 transition-all cursor-pointer"
                  >
                    <MapPin className="w-3 h-3" /> {selectedRoute.city}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile bottom drawer trigger */}
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
            className="absolute inset-x-0 bottom-0 top-[40%] z-20 bg-background/98 backdrop-blur-2xl border-t border-border/30 rounded-t-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 pb-2">
              <div className="flex items-center gap-2">
                <Route className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold">Routes</span>
              </div>
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
                  <Route className="w-8 h-8 mx-auto mb-2 text-muted-foreground/20" />
                  <p className="text-xs text-muted-foreground/60">No routes in this range</p>
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

      {/* Top-right link */}
      <div className="absolute top-3 right-3 z-10 hidden sm:block">
        <Link href="/map"
          className="inline-flex items-center gap-1.5 text-[10px] font-medium px-3 py-1.5 rounded-full bg-background/80 backdrop-blur-xl border border-border/30 text-muted-foreground/70 hover:text-white hover:border-primary/30 transition-all shadow-lg"
        >
          <Navigation className="w-3 h-3" /> Full Map
        </Link>
      </div>
    </div>
  );
}
