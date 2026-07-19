"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Crosshair, AlertTriangle, RefreshCw, Maximize2, Minimize2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const DARK_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

interface MapboxMapProps {
  center: [number, number];
  zoom: number;
  onMoveEnd?: (center: [number, number], zoom: number) => void;
  onMapReady?: (map: any) => void;
  onClick?: (lngLat: { lng: number; lat: number }) => void;
  children?: React.ReactNode;
  className?: string;
  onUserLocationChange?: (pos: { lat: number; lng: number } | null) => void;
  flyTo?: { center: [number, number]; zoom?: number; pitch?: number; bearing?: number };
}

export function MapboxMap({
  center,
  zoom,
  onMoveEnd,
  onMapReady,
  onClick,
  children,
  className,
  onUserLocationChange,
  flyTo,
}: MapboxMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [userPosition, setUserPosition] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [locationPermission, setLocationPermission] = useState<"granted" | "denied" | "prompt" | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const pendingFlyToRef = useRef(flyTo);

  useEffect(() => {
    pendingFlyToRef.current = flyTo;
  }, [flyTo]);

  const [mapStyle] = useState(() => {
    return process.env.NEXT_PUBLIC_MAP_STYLE || DARK_STYLE;
  });

  const handleToggleFullscreen = useCallback(() => {
    const container = mapContainerRef.current?.parentElement || mapContainerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => {
        setIsFullscreen(true);
        toast.success("Fullscreen enabled");
        setTimeout(() => mapRef.current?.resize(), 300);
      }).catch(() => {
        toast.error("Fullscreen not supported");
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
        toast.success("Fullscreen disabled");
        setTimeout(() => mapRef.current?.resize(), 300);
      }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const handler = () => {
      setIsFullscreen(!!document.fullscreenElement);
      setTimeout(() => mapRef.current?.resize(), 300);
    };
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let mapInstance: any = null;

    async function initMap() {
      if (!mapContainerRef.current) return;

      try {
        const mod = await import("maplibre-gl");
        if (cancelled) return;

        const mlgl = mod.default || mod;

        const map = new mlgl.Map({
          container: mapContainerRef.current,
          style: mapStyle,
          center,
          zoom,
          attributionControl: true,
        } as any);

        map.addControl(new mlgl.NavigationControl(), "bottom-right");

        map.on("load", () => {
          if (cancelled) return;
          setLoading(false);
          setError(null);
          (map as any).resize();
          const pending = pendingFlyToRef.current;
          if (pending) {
            map.flyTo({
              center: pending.center,
              zoom: pending.zoom || 14,
              speed: 1.2,
              curve: 1.42,
            });
          }
          onMapReady?.(map);
        });

        map.on("moveend", () => {
          const newCenter: [number, number] = [
            map.getCenter().lng,
            map.getCenter().lat,
          ];
          const newZoom = map.getZoom();
          onMoveEnd?.(newCenter, newZoom);
        });

        map.on("click", (e: any) => {
          onClick?.({ lng: e.lngLat.lng, lat: e.lngLat.lat });
        });

        map.on("error", () => {});

        mapInstance = map;
        mapRef.current = map;
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || "Failed to load map");
          setLoading(false);
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
  }, [mapStyle, retryCount]);

  useEffect(() => {
    if (flyTo && mapRef.current) {
      mapRef.current.flyTo({
        center: flyTo.center,
        zoom: flyTo.zoom || 14,
        speed: 1.2,
        curve: 1.42,
      });
    }
  }, [flyTo]);

  const startLocationTracking = useCallback(() => {
    if (!("geolocation" in navigator)) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    toast.loading("Finding your location...");

    navigator.permissions.query({ name: 'geolocation' as PermissionName }).then((result) => {
      setLocationPermission(result.state as "granted" | "denied" | "prompt");
      if (result.state === "denied") {
        toast.dismiss();
        toast.error("Location access denied. Enable it in browser settings.");
      }
    });

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const accuracy = pos.coords.accuracy;

        setUserPosition({ lat, lng, accuracy });
        onUserLocationChange?.({ lat, lng });
        setLocationPermission("granted");
        toast.dismiss();
        toast.success("Location updated");
      },
      (err) => {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setLocationPermission("denied");
            toast.dismiss();
            toast.error("Location permission denied. Enable it in browser settings.");
            break;
          case err.POSITION_UNAVAILABLE:
            toast.error("Location unavailable. Try again.");
            break;
          case err.TIMEOUT:
            toast.error("Location request timed out. Try again.");
            break;
          default:
            toast.error("Failed to get location");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );
  }, [onUserLocationChange]);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const handleGoToUserLocation = useCallback(() => {
    if (!userPosition) {
      startLocationTracking();
      return;
    }
    const map = mapRef.current;
    if (map) {
      map.flyTo({ center: [userPosition.lng, userPosition.lat], zoom: 15, duration: 1500 });
      toast.success("Centered on your location");
    }
  }, [userPosition, startLocationTracking]);

  const handleRecenterMap = useCallback(() => {
    if (userPosition) {
      const map = mapRef.current;
      if (map) {
        map.flyTo({ center: [userPosition.lng, userPosition.lat], zoom: 15, duration: 1500 });
        toast.success("Centered on your location");
        return;
      }
    }
    const map = mapRef.current;
    if (map) {
      map.flyTo({ center, zoom: 5, duration: 1500 });
      toast.success("Map recentered");
    }
  }, [userPosition, center]);

  const handleRetry = useCallback(() => {
    setError(null);
    setLoading(true);
    setRetryCount((c) => c + 1);
  }, []);

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center bg-muted/50 rounded-xl ${className || ""}`}>
        <AlertTriangle className="h-10 w-10 text-red-400 mb-3" />
        <p className="text-muted-foreground text-sm font-medium">{error}</p>
        <p className="text-muted-foreground/60 text-xs mt-1 mb-4">Check your connection and try again</p>
        <Button variant="secondary" size="sm" onClick={handleRetry} className="gap-2">
          <RefreshCw className="h-4 w-4" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className={`relative ${className || ""}`}>
      {loading && (
        <div className="absolute inset-0 z-10 flex flex-col gap-4 p-6">
          <Skeleton className="h-full w-full rounded-xl" />
        </div>
      )}
      <div ref={mapContainerRef} className="h-full w-full" />

      {/* Map Controls - bottom right */}
      <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-2">
        {/* My Location */}
        <div className="group relative">
          <button
            onClick={handleGoToUserLocation}
            disabled={locationPermission === "denied"}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl border shadow-lg transition-all cursor-pointer",
              locationPermission === "denied"
                ? "border-red-500/30 bg-red-500/10 text-red-400 cursor-not-allowed opacity-60"
                : userPosition
                  ? "border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:scale-105 active:scale-95"
                  : "border-border bg-card text-white hover:bg-white/10 hover:scale-105 active:scale-95"
            )}
            aria-label="My Location"
          >
            {locationPermission === "denied" ? (
              <AlertTriangle className="h-5 w-5" />
            ) : userPosition ? (
              <div className="relative">
                <Crosshair className="h-5 w-5" />
                <span className="absolute inset-0 animate-ping rounded-full bg-blue-400/20" />
              </div>
            ) : (
              <Crosshair className="h-5 w-5" />
            )}
          </button>
          <span className="absolute right-12 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-card/90 px-2.5 py-1.5 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none border border-border shadow-lg">
            {locationPermission === "denied" ? "Location blocked" : userPosition ? "My Location" : "Find Me"}
          </span>
        </div>

        {/* Recenter */}
        <div className="group relative">
          <button
            onClick={handleRecenterMap}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card shadow-lg transition-all hover:bg-white/10 hover:scale-105 active:scale-95 cursor-pointer"
            aria-label="Recenter"
          >
            <RotateCcw className="h-5 w-5 text-white" />
          </button>
          <span className="absolute right-12 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-card/90 px-2.5 py-1.5 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none border border-border shadow-lg">
            Recenter
          </span>
        </div>

        {/* Fullscreen Toggle */}
        <div className="group relative">
          <button
            onClick={handleToggleFullscreen}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card shadow-lg transition-all hover:bg-white/10 hover:scale-105 active:scale-95 cursor-pointer"
            aria-label="Toggle fullscreen"
          >
            {isFullscreen ? <Minimize2 className="h-5 w-5 text-white" /> : <Maximize2 className="h-5 w-5 text-white" />}
          </button>
          <span className="absolute right-12 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-card/90 px-2.5 py-1.5 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none border border-border shadow-lg">
            {isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          </span>
        </div>
      </div>

      {/* Permission Denied Banner */}
      {locationPermission === "denied" && (
        <div className="absolute bottom-36 right-4 z-20 max-w-[280px] rounded-xl border border-red-500/30 bg-red-500/10 p-3 shadow-lg backdrop-blur">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-medium text-red-400">Location Access Denied</p>
              <p className="text-[10px] text-red-400/70 mt-1">Enable location in browser settings to see your position.</p>
              <button onClick={() => { setLocationPermission(null); startLocationTracking(); }}
                className="mt-2 text-[10px] font-medium text-red-400 hover:text-red-300 underline cursor-pointer">
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Location Marker (rendered via Maplibre layers in useEffect) */}
      <UserLocationMarker map={mapRef.current} position={userPosition} />

      {children}
    </div>
  );
}

function UserLocationMarker({ map, position }: { map: any; position: { lat: number; lng: number; accuracy: number } | null }) {
  useEffect(() => {
    if (!map || !map.isStyleLoaded || !map.isStyleLoaded()) return;

    const addOrUpdate = () => {
      try {
        if (!map.getSource('user-location')) {
          map.addSource('user-location', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] }
          });

          map.addLayer({
            id: 'user-location-accuracy',
            type: 'circle',
            source: 'user-location',
            paint: {
              'circle-color': '#3B82F6',
              'circle-opacity': 0.1,
              'circle-stroke-width': 1,
              'circle-stroke-color': '#3B82F6',
              'circle-stroke-opacity': 0.3,
            }
          });

          map.addLayer({
            id: 'user-location-pulse',
            type: 'circle',
            source: 'user-location',
            paint: {
              'circle-color': '#3B82F6',
              'circle-radius': 12,
              'circle-opacity': 0.2,
            }
          });

          map.addLayer({
            id: 'user-location-dot',
            type: 'circle',
            source: 'user-location',
            paint: {
              'circle-color': '#3B82F6',
              'circle-radius': 6,
              'circle-stroke-width': 3,
              'circle-stroke-color': '#FFFFFF',
            }
          });
        }

        if (position) {
          const accuracyInMeters = position.accuracy || 50;
          map.getSource('user-location').setData({
            type: 'FeatureCollection',
            features: [{
              type: 'Feature',
              geometry: { type: 'Point', coordinates: [position.lng, position.lat] },
              properties: { accuracy: accuracyInMeters }
            }]
          });

          if (map.getLayer('user-location-accuracy')) {
            map.setPaintProperty('user-location-accuracy', 'circle-radius', accuracyInMeters);
          }
        }
      } catch {}
    };

    if (map.isStyleLoaded()) {
      addOrUpdate();
    } else {
      map.once('style.load', addOrUpdate);
    }
  }, [map, position]);

  return null;
}
