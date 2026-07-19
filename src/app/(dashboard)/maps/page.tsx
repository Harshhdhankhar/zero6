"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  Layers, PanelRightOpen, PanelRightClose, Map, ChevronDown,
  MapPin, Shield, Crosshair, Route, Navigation,
  Loader2, AlertTriangle, RefreshCw,
} from "lucide-react";
import { SearchBar } from "@/components/maps/search-bar";
import { LayerControl, useLayers } from "@/components/maps/layer-control";
import { HeatmapLayer } from "@/components/maps/heatmap-layer";
import { PersonalHeatmap } from "@/components/maps/personal-heatmap";
import { CommunityPhotosLayer } from "@/components/maps/community-photos-layer";
import { LiveRunLayer } from "@/components/maps/live-run-layer";
import { SafetyPanel } from "@/components/maps/safety-panel";
import { NearbyPanel } from "@/components/maps/nearby-panel";
import { DiscoveryDashboard } from "@/components/maps/discovery-dashboard";
import { FloatingBottomSheet, SheetContentType } from "@/components/maps/floating-bottom-sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, formatDistance, formatPace, formatDuration } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";

const MapboxMap = dynamic(
  () => import("@/components/maps/mapbox-map").then((m) => ({ default: m.MapboxMap })),
  { ssr: false }
);

interface SearchResult {
  id: string; name: string; description: string;
  latitude: number; longitude: number; type: string; subtitle: string;
}

interface DetailData {
  type: "route" | "spot" | "event" | "club" | "live_run" | "search" | "photo";
  data: any;
}

interface SheetSelection {
  open: boolean; contentType: SheetContentType | null; content: any;
}

export default function MapsPage() {
  const [center, setCenter] = useState<[number, number]>([78.9629, 20.5937]);
  const [zoom, setZoom] = useState(5);
  const [targetFlyTo, setTargetFlyTo] = useState<{ center: [number, number]; zoom?: number } | undefined>(undefined);
  const [layersOpen, setLayersOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [detailData, setDetailData] = useState<DetailData | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [safetyPanelOpen, setSafetyPanelOpen] = useState(false);
  const [nearbyPanelOpen, setNearbyPanelOpen] = useState(false);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [sheetSelection, setSheetSelection] = useState<SheetSelection>({ open: false, contentType: null, content: null });
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapLoading, setMapLoading] = useState(true);

  const { layers, setLayers } = useLayers();

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const triggerFlyTo = useCallback((c: [number, number], z?: number) => {
    setTargetFlyTo({ center: c, zoom: z || 14 });
  }, []);

  const handleMoveEnd = useCallback((newCenter: [number, number], newZoom: number) => {
    setCenter(newCenter);
    setZoom(newZoom);
  }, []);

  const handleMapClick = useCallback((lngLat: { lng: number; lat: number }) => {
    setDetailData(null);
    setSelectedResult(null);
    setSheetSelection({ open: false, contentType: null, content: null });
  }, []);

  const handleMapReady = useCallback((map: any) => {
    setMapInstance(map);
    setMapLoading(false);
    setMapError(null);
    toast.success("Map loaded");
  }, []);

  const handleMapError = useCallback((err: string) => {
    setMapError(err);
    setMapLoading(false);
  }, []);

  const handleResultClick = useCallback((result: SearchResult) => {
    setSheetSelection({ open: false, contentType: null, content: null });
    setSelectedResult(result);
    setDetailData({ type: "search", data: result });
    triggerFlyTo([result.longitude, result.latitude], 15);
    if (isMobile) {
      setMobileSheetOpen(true);
      setLayersOpen(false);
    } else {
      setDetailOpen(true);
    }
    toast.success(`Showing: ${result.name}`);
  }, [isMobile, triggerFlyTo]);

  const handleRouteClick = useCallback((route: any) => {
    setMobileSheetOpen(false);
    if (route.geometry && route.geometry.length > 0) {
      const lngs = route.geometry.map((pt: any) => pt.lng);
      const lats = route.geometry.map((pt: any) => pt.lat);
      const c: [number, number] = [(Math.min(...lngs) + Math.max(...lngs)) / 2, (Math.min(...lats) + Math.max(...lats)) / 2];
      triggerFlyTo(c, 14);
    }
    setSheetSelection({ open: true, contentType: "route", content: route });
  }, [triggerFlyTo]);

  const handleSpotClick = useCallback((spot: any) => {
    setMobileSheetOpen(false);
    if (spot.longitude && spot.latitude) {
      triggerFlyTo([spot.longitude, spot.latitude], 16);
    }
    setSheetSelection({ open: true, contentType: "spot", content: spot });
  }, [triggerFlyTo]);

  const handleEventClick = useCallback((event: any) => {
    setMobileSheetOpen(false);
    if (event.latitude && event.longitude) {
      triggerFlyTo([event.longitude, event.latitude], 13);
    }
    setSheetSelection({ open: true, contentType: "event", content: event });
  }, [triggerFlyTo]);

  const handleClubClick = useCallback((club: any) => {
    setMobileSheetOpen(false);
    if (club.latitude && club.longitude) {
      triggerFlyTo([club.longitude, club.latitude], 13);
    }
    setSheetSelection({ open: true, contentType: "community", content: club });
  }, [triggerFlyTo]);

  const handleLiveRunClick = useCallback((run: any) => {
    setMobileSheetOpen(false);
    if (run.currentLatitude && run.currentLongitude) {
      triggerFlyTo([run.currentLongitude, run.currentLatitude], 15);
    }
    setSheetSelection({ open: true, contentType: "live-run", content: run });
  }, [triggerFlyTo]);

  const handlePhotoClick = useCallback((photo: any) => {
    setMobileSheetOpen(false);
    setSheetSelection({ open: true, contentType: "photo", content: photo });
  }, []);

  const sidebarContent = (
    <div className="w-[260px] p-4">
      <h3 className="text-sm font-semibold mb-3">Map Layers</h3>
      <LayerControl open={true} activeLayers={layers} onLayersChange={setLayers} />
      <div className="mt-4 space-y-2">
        <Button variant="ghost" size="sm" onClick={() => { setSafetyPanelOpen(true); setNearbyPanelOpen(false); }}
          className={cn("w-full justify-start gap-3 rounded-xl", safetyPanelOpen && "bg-primary/10 text-primary")}>
          <Shield className="h-4 w-4" /><span>Safety & Conditions</span>
        </Button>
        <Button variant="ghost" size="sm" onClick={() => { setNearbyPanelOpen(true); setSafetyPanelOpen(false); }}
          className={cn("w-full justify-start gap-3 rounded-xl", nearbyPanelOpen && "bg-primary/10 text-primary")}>
          <Navigation className="h-4 w-4" /><span>Around You</span>
        </Button>
      </div>
    </div>
  );

  return (
    <div className="relative flex h-[calc(100dvh-4rem)] flex-col overflow-hidden -m-4 sm:-m-6 lg:-m-8">
      {/* Top Bar */}
      <div className="flex shrink-0 items-center gap-3 border-b border-border bg-card px-4 py-3 z-10">
        <div className="flex items-center gap-2">
          <Map className="h-5 w-5 text-primary" />
          <h1 className="heading-md text-lg">Maps</h1>
        </div>
        <div className="hidden sm:block flex-1 max-w-md">
          <SearchBar onResultClick={handleResultClick} />
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <Button variant="ghost" size="sm" onClick={() => { setLayersOpen(!layersOpen); if (isMobile && !layersOpen) setMobileSheetOpen(true); }}
            className={cn("gap-2 rounded-xl", layersOpen && "bg-primary/10 text-primary")} aria-label="Toggle layers">
            <Layers className="h-4 w-4" /><span className="hidden sm:inline">Layers</span>
          </Button>
          {!isMobile && (
            <Button variant="ghost" size="sm" onClick={() => setDetailOpen(!detailOpen)} className="gap-2 rounded-xl" aria-label="Toggle details">
              {detailOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
              <span className="hidden sm:inline">Details</span>
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Search */}
      <div className="sm:hidden shrink-0 border-b border-border bg-card px-4 py-2">
        <SearchBar onResultClick={handleResultClick} />
      </div>

      {/* Map Area */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Left Sidebar (desktop) */}
        <AnimatePresence>
          {!isMobile && layersOpen && (
            <motion.aside initial={{ width: 0, opacity: 0 }} animate={{ width: 260, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="shrink-0 overflow-hidden border-r border-border bg-card">
              {sidebarContent}
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Map */}
        <div className="flex-1 relative">
          <MapboxMap
            center={center}
            zoom={zoom}
            onMoveEnd={handleMoveEnd}
            onMapReady={handleMapReady}
            onClick={handleMapClick}
            className="h-full w-full"
            onUserLocationChange={() => {}}
            flyTo={targetFlyTo}
          />

          {/* Map Loading State */}
          {mapLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading map...</p>
              </div>
            </div>
          )}

          {/* Map Error State */}
          {mapError && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
              <div className="flex flex-col items-center gap-3 text-center max-w-sm">
                <AlertTriangle className="h-10 w-10 text-red-400" />
                <p className="text-sm font-medium text-foreground">{mapError}</p>
                <Button variant="secondary" size="sm" onClick={() => { setMapError(null); setMapLoading(true); }} className="gap-2">
                  <RefreshCw className="h-4 w-4" /> Retry
                </Button>
              </div>
            </div>
          )}

          {/* Discovery Dashboard */}
          <DiscoveryDashboard />

          {/* Canvas-based overlays */}
          <HeatmapLayer center={center} zoom={zoom} active={layers.heatmap} />
          {layers.communityPhotos && (
            <CommunityPhotosLayer center={center} zoom={zoom} active={layers.communityPhotos} onPhotoClick={handlePhotoClick} />
          )}
          <LiveRunLayer center={center} zoom={zoom} active={layers.liveRuns} onRunClick={handleLiveRunClick} />

          {/* Maplibre GL-based layers */}
          {mapInstance && layers.routes && (
            <RoutesLayerComponent map={mapInstance} active={layers.routes} onRouteClick={handleRouteClick} />
          )}
          {mapInstance && layers.runningSpots && (
            <SpotsLayerComponent map={mapInstance} active={layers.runningSpots} onSpotClick={handleSpotClick} />
          )}
          {mapInstance && layers.events && (
            <EventsLayerComponent map={mapInstance} active={layers.events} onEventClick={handleEventClick} />
          )}
          {mapInstance && layers.clubs && (
            <ClubsLayerComponent map={mapInstance} active={layers.clubs} onClubClick={handleClubClick} />
          )}

          {/* Floating panels */}
          {safetyPanelOpen && (
            <motion.aside initial={{ x: 320, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 320, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="absolute right-4 top-4 z-20 w-[360px] max-w-[calc(100dvw-2rem)] max-h-[calc(100%-2rem)] overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl">
              <SafetyPanel center={center} onClose={() => setSafetyPanelOpen(false)} />
            </motion.aside>
          )}

          {nearbyPanelOpen && (
            <motion.aside initial={{ x: 320, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 320, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="absolute right-4 top-4 z-20 w-[360px] max-w-[calc(100dvw-2rem)] max-h-[calc(100%-2rem)] overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl">
              <NearbyPanel onClose={() => setNearbyPanelOpen(false)} />
            </motion.aside>
          )}

          {/* Floating Bottom Sheet */}
          <FloatingBottomSheet
            open={sheetSelection.open}
            onClose={() => setSheetSelection({ open: false, contentType: null, content: null })}
            contentType={sheetSelection.contentType}
            content={sheetSelection.content}
          />
        </div>

        {/* Right Detail Panel (desktop) */}
        <AnimatePresence>
          {!isMobile && detailOpen && (
            <motion.aside initial={{ width: 0, opacity: 0 }} animate={{ width: 360, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="shrink-0 overflow-hidden border-l border-border bg-card">
              <div className="w-[360px] p-4 overflow-y-auto h-full">
                {detailData ? (
                  <DetailPanelContent detailData={detailData} onClose={() => { setDetailOpen(false); setDetailData(null); setSelectedResult(null); }} />
                ) : (
                  <div className="flex flex-col h-full">
                    <div className="flex-1 overflow-y-auto">
                      <PersonalHeatmap />
                    </div>
                    <div className="flex flex-col items-center justify-center py-4 text-center border-t border-border">
                      <MapPin className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-xs text-muted-foreground">Click a search result or map feature to see details</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Mobile Layer Toggle & Bottom Sheet */}
        {isMobile && (
          <>
            <button onClick={() => { setLayersOpen(!layersOpen); if (!layersOpen) setMobileSheetOpen(false); }}
              className={cn("absolute left-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card shadow-lg transition-colors cursor-pointer",
                layersOpen ? "bg-primary/10 border-primary/30" : "")} aria-label="Toggle layers">
              <Layers className="h-5 w-5" />
            </button>
            <AnimatePresence>
              {mobileSheetOpen && (
                <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                  transition={{ type: "spring", damping: 30, stiffness: 300 }}
                  className="fixed bottom-0 left-0 right-0 z-50 max-h-[70dvh] overflow-y-auto rounded-t-2xl border-t border-border bg-card shadow-2xl">
                  <div className="sticky top-0 bg-card z-10">
                    <div className="flex items-center justify-center pt-3 pb-2"><div className="h-1 w-12 rounded-full bg-white/20" /></div>
                    <div className="flex items-center justify-between px-4 pb-3 border-b border-border">
                      <h3 className="text-sm font-semibold">{layersOpen ? "Map Layers" : detailData ? "Details" : "Map"}</h3>
                      <button onClick={() => setMobileSheetOpen(false)} className="text-muted-foreground hover:text-foreground cursor-pointer" aria-label="Close">
                        <ChevronDown className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  <div className="p-4">
                    {layersOpen && <LayerControl open={true} activeLayers={layers} onLayersChange={setLayers} />}
                    {!layersOpen && detailData && <DetailPanelContent detailData={detailData} onClose={() => { setDetailData(null); setSelectedResult(null); }} />}
                    {!layersOpen && !detailData && (
                      <p className="text-sm text-muted-foreground text-center py-8">Click a search result or map feature to see details</p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
}

function DetailPanelContent({ detailData, onClose }: { detailData: DetailData; onClose: () => void }) {
  const content = useMemo(() => {
    switch (detailData.type) {
      case "search": {
        const r = detailData.data as SearchResult;
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="heading-md text-lg">{r.name}</h3>
              <Button variant="ghost" size="sm" onClick={onClose} className="rounded-xl"><PanelRightClose className="h-4 w-4" /></Button>
            </div>
            <p className="text-sm text-muted-foreground">{r.description}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 text-primary" /><span>{r.subtitle}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Crosshair className="h-3 w-3" /><span>{r.latitude.toFixed(4)}, {r.longitude.toFixed(4)}</span>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              {r.type === "places" && <Link href={`/spots/${r.id}`} className="text-sm font-medium text-primary hover:underline">View Spot Details →</Link>}
              {r.type === "routes" && <Link href={`/routes/${r.id}`} className="text-sm font-medium text-primary hover:underline">View Route →</Link>}
              {r.type === "events" && <Link href={`/events/${r.id}`} className="text-sm font-medium text-primary hover:underline">View Event →</Link>}
              {r.type === "clubs" && <Link href={`/communities/${r.id}`} className="text-sm font-medium text-primary hover:underline">View Club →</Link>}
            </div>
          </div>
        );
      }
      case "route": {
        const route = detailData.data;
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="heading-md text-lg truncate">{route.title || route.name}</h3>
              <Button variant="ghost" size="sm" onClick={onClose} className="rounded-xl"><PanelRightClose className="h-4 w-4" /></Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-secondary/30 p-3 text-center">
                <p className="text-[10px] text-white/40 uppercase">Distance</p>
                <p className="text-sm font-bold text-white">{formatDistance(route.distance || 0)}</p>
              </div>
              <div className="rounded-xl bg-secondary/30 p-3 text-center">
                <p className="text-[10px] text-white/40 uppercase">Elevation</p>
                <p className="text-sm font-bold text-white">{(route.elevation_gain || 0).toFixed(0)}m</p>
              </div>
              <div className="rounded-xl bg-secondary/30 p-3 text-center">
                <p className="text-[10px] text-white/40 uppercase">Difficulty</p>
                <Badge variant="secondary" className="mt-0.5 capitalize">{route.difficulty || "moderate"}</Badge>
              </div>
              <div className="rounded-xl bg-secondary/30 p-3 text-center">
                <p className="text-[10px] text-white/40 uppercase">Surface</p>
                <p className="text-sm font-bold text-white capitalize">{route.surface_type || route.surface || "road"}</p>
              </div>
            </div>
            {route.average_rating > 0 && (
              <div className="flex items-center gap-2 text-sm"><span className="text-yellow-400">★</span><span className="text-white">{route.average_rating.toFixed(1)} / 5</span></div>
            )}
            <Link href={`/routes/${route.id}`} className="flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              <Route className="h-4 w-4" /> View Full Route Details
            </Link>
          </div>
        );
      }
      case "spot": {
        const spot = detailData.data;
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="heading-md text-lg truncate">{spot.name}</h3>
              <Button variant="ghost" size="sm" onClick={onClose} className="rounded-xl"><PanelRightClose className="h-4 w-4" /></Button>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="capitalize">{spot.spotType || "park"}</Badge>
              <Badge variant="outline">{spot.averageRating?.toFixed(1) || "N/A"} ★</Badge>
            </div>
            {spot.description && <p className="text-sm text-muted-foreground">{spot.description}</p>}
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />{spot.city || "Location"}
            </div>
            <Link href={`/spots/${spot.id}`} className="flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">View Spot Details →</Link>
          </div>
        );
      }
      case "event": {
        const event = detailData.data;
        const eventDate = new Date(event.date);
        const daysUntil = Math.ceil((eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="heading-md text-lg truncate">{event.title}</h3>
              <Button variant="ghost" size="sm" onClick={onClose} className="rounded-xl"><PanelRightClose className="h-4 w-4" /></Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-secondary/30 p-3 text-center">
                <p className="text-[10px] text-white/40 uppercase">Date</p>
                <p className="text-sm font-bold text-white">{eventDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
              </div>
              <div className="rounded-xl bg-secondary/30 p-3 text-center">
                <p className="text-[10px] text-white/40 uppercase">Type</p>
                <p className="text-sm font-bold text-white capitalize">{event.type?.replace("_", " ") || "Run"}</p>
              </div>
              <div className="rounded-xl bg-secondary/30 p-3 text-center">
                <p className="text-[10px] text-white/40 uppercase">Participants</p>
                <p className="text-sm font-bold text-white">{event.registered_count || 0} / {event.max_participants || "∞"}</p>
              </div>
              <div className="rounded-xl bg-secondary/30 p-3 text-center">
                <p className="text-[10px] text-white/40 uppercase">Countdown</p>
                <p className="text-sm font-bold text-white">{daysUntil > 0 ? `${daysUntil}d` : "Ongoing"}</p>
              </div>
            </div>
            <Link href={`/events/${event.id}`} className="flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">Register / View Event</Link>
          </div>
        );
      }
      case "club": {
        const club = detailData.data;
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="heading-md text-lg truncate">{club.name}</h3>
              <Button variant="ghost" size="sm" onClick={onClose} className="rounded-xl"><PanelRightClose className="h-4 w-4" /></Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-secondary/30 p-3 text-center">
                <p className="text-[10px] text-white/40 uppercase">Members</p>
                <p className="text-sm font-bold text-white">{club.member_count || 0}</p>
              </div>
              <div className="rounded-xl bg-secondary/30 p-3 text-center">
                <p className="text-[10px] text-white/40 uppercase">Category</p>
                <p className="text-sm font-bold text-white capitalize">{club.category || "social"}</p>
              </div>
            </div>
            {club.city && <div className="flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="h-4 w-4 text-primary" />{club.city}</div>}
            <Link href={`/communities/${club.id}`} className="flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">View Club →</Link>
          </div>
        );
      }
      case "live_run": {
        const run = detailData.data;
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="heading-md text-lg truncate">{run.userName}</h3>
              <Button variant="ghost" size="sm" onClick={onClose} className="rounded-xl"><PanelRightClose className="h-4 w-4" /></Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-secondary/30 p-3 text-center">
                <p className="text-[10px] text-white/40 uppercase">Pace</p>
                <p className="text-sm font-bold text-white">{formatPace(run.averagePace)}</p>
              </div>
              <div className="rounded-xl bg-secondary/30 p-3 text-center">
                <p className="text-[10px] text-white/40 uppercase">Duration</p>
                <p className="text-sm font-bold text-white">{formatDuration(run.duration)}</p>
              </div>
              <div className="rounded-xl bg-secondary/30 p-3 text-center">
                <p className="text-[10px] text-white/40 uppercase">Distance</p>
                <p className="text-sm font-bold text-white">{(run.distance / 1000).toFixed(2)}km</p>
              </div>
              <div className="rounded-xl bg-secondary/30 p-3 text-center">
                <p className="text-[10px] text-white/40 uppercase">Elevation</p>
                <p className="text-sm font-bold text-white">{run.elevationGain}m</p>
              </div>
            </div>
          </div>
        );
      }
      default:
        return null;
    }
  }, [detailData, onClose]);

  return <AnimatePresence mode="wait">
    <motion.div key={detailData.type} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
      {content}
    </motion.div>
  </AnimatePresence>;
}

const RoutesLayerComponent = dynamic(() => import("@/components/maps/routes-layer").then((m) => ({ default: m.RoutesLayer })), { ssr: false });
const SpotsLayerComponent = dynamic(() => import("@/components/maps/spots-layer").then((m) => ({ default: m.SpotsLayer })), { ssr: false });
const EventsLayerComponent = dynamic(() => import("@/components/maps/events-layer").then((m) => ({ default: m.EventsLayer })), { ssr: false });
const ClubsLayerComponent = dynamic(() => import("@/components/maps/clubs-layer").then((m) => ({ default: m.ClubsLayer })), { ssr: false });
