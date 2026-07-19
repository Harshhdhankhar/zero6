"use client";

import React, { useEffect, useRef, useState } from "react";
import { MapPin, Download, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistance } from "@/lib/utils";

interface Waypoint {
  id: string;
  latitude: number;
  longitude: number;
  altitude: number | null;
  speed: number | null;
  recordedAt: string;
}

interface PersonalHeatmapSummary {
  totalUniqueLocations: number;
  mostVisitedLocation: string | null;
  longestRouteId: string | null;
  favoriteRouteId: string | null;
  totalDistanceCovered: number;
}

interface PersonalHeatmapData {
  waypoints: Waypoint[];
  summary: PersonalHeatmapSummary;
  meta: { total: number; page: number; limit: number };
}

const CENTER_INDIA: [number, number] = [78.9629, 20.5937];

function latLngToCanvasPoint(
  lat: number,
  lng: number,
  centerLat: number,
  centerLng: number,
  zoom: number,
  canvasWidth: number,
  canvasHeight: number
): { x: number; y: number } | null {
  const n = Math.pow(2, zoom);
  const tileSize = 512;

  function toWorld(lat: number, lng: number) {
    const x = ((lng + 180) / 360) * n * tileSize;
    const y =
      ((1 -
        Math.log(
          Math.tan((lat * Math.PI) / 180) +
            1 / Math.cos((lat * Math.PI) / 180)
        ) /
          Math.PI) /
        2) *
      n *
      tileSize;
    return { x, y };
  }

  const cw = toWorld(centerLat, centerLng);
  const pw = toWorld(lat, lng);

  const sx = canvasWidth / 2 + (pw.x - cw.x);
  const sy = canvasHeight / 2 + (pw.y - cw.y);

  if (
    sx < -50 ||
    sx > canvasWidth + 50 ||
    sy < -50 ||
    sy > canvasHeight + 50
  ) {
    return null;
  }

  return { x: sx, y: sy };
}

export function PersonalHeatmap() {
  const [data, setData] = useState<PersonalHeatmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  const miniMapZoom = 4;

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setCanvasSize({
          width: Math.round(entry.contentRect.width),
          height: Math.round(entry.contentRect.height),
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/heatmap/personal?limit=5000");
        if (!res.ok) {
          if (res.status === 401) {
            setError("Authentication required");
          } else {
            setError(`HTTP ${res.status}`);
          }
          return;
        }
        const json = await res.json();
        setData(json.data ?? json);
      } catch (err: any) {
        setError(err.message || "Failed to load heatmap");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (
      !canvasRef.current ||
      !canvasSize.width ||
      !canvasSize.height ||
      !data
    )
      return;

    const canvas = canvasRef.current;
    canvas.width = canvasSize.width * devicePixelRatio;
    canvas.height = canvasSize.height * devicePixelRatio;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.scale(devicePixelRatio, devicePixelRatio);
    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);

    if (!visible || data.waypoints.length === 0) return;

    ctx.globalCompositeOperation = "lighter";

    for (const wp of data.waypoints) {
      const pt = latLngToCanvasPoint(
        wp.latitude,
        wp.longitude,
        CENTER_INDIA[1],
        CENTER_INDIA[0],
        miniMapZoom,
        canvasSize.width,
        canvasSize.height
      );
      if (!pt) continue;

      const radius = 3;
      const gradient = ctx.createRadialGradient(
        pt.x,
        pt.y,
        0,
        pt.x,
        pt.y,
        radius * 3
      );
      gradient.addColorStop(0, "rgba(255, 90, 31, 0.8)");
      gradient.addColorStop(0.5, "rgba(255, 90, 31, 0.3)");
      gradient.addColorStop(1, "rgba(255, 90, 31, 0)");

      ctx.beginPath();
      ctx.arc(pt.x, pt.y, radius * 3, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
    }

    ctx.globalCompositeOperation = "source-over";
  }, [data, canvasSize, visible, miniMapZoom]);

  async function handleExport() {
    try {
      const res = await fetch("/api/heatmap/export");
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "zero6-heatmap.geojson";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-40 w-full rounded-xl" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <MapPin className="h-10 w-10 text-muted-foreground/30 mb-3" />
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  const summary = data?.summary;
  const waypoints = data?.waypoints || [];
  const waypointCount = data?.meta?.total || waypoints.length;

  const uniqueLocations = new Set(
    waypoints.map((w) => `${w.latitude.toFixed(4)},${w.longitude.toFixed(4)}`)
  ).size;

  return (
    <div className="space-y-4">
      <div
        ref={containerRef}
        className="relative h-40 overflow-hidden rounded-xl border border-border bg-card"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full"
          style={{ width: canvasSize.width, height: canvasSize.height }}
        />

        {!visible && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <p className="text-xs text-white/50">Heatmap hidden</p>
          </div>
        )}

        {waypoints.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-xs text-muted-foreground">No data yet</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-card p-3">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            Unique Locations
          </p>
          <p className="mt-1 text-lg font-bold text-white">
            {summary?.totalUniqueLocations ?? uniqueLocations}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-3">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            Most Visited
          </p>
          <p className="mt-1 text-sm font-semibold text-white truncate">
            {summary?.mostVisitedLocation || "N/A"}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-3">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            Total Waypoints
          </p>
          <p className="mt-1 text-lg font-bold text-white">
            {waypointCount.toLocaleString()}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-3">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            Distance Covered
          </p>
          <p className="mt-1 text-lg font-bold text-white">
            {summary?.totalDistanceCovered
              ? formatDistance(summary.totalDistanceCovered)
              : "N/A"}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setVisible(!visible)}
          className="flex-1 gap-2 rounded-xl text-xs"
        >
          {visible ? (
            <>
              <EyeOff className="h-3.5 w-3.5" /> Hide
            </>
          ) : (
            <>
              <Eye className="h-3.5 w-3.5" /> Show
            </>
          )}
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={handleExport}
          className="flex-1 gap-2 rounded-xl text-xs"
          disabled={waypoints.length === 0}
        >
          <Download className="h-3.5 w-3.5" /> Export GeoJSON
        </Button>
      </div>
    </div>
  );
}
