"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Filter, Sun, Moon, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeatmapTile {
  tileX: number;
  tileY: number;
  intensity: number;
  runCount: number;
  runnerCount: number;
}

interface HeatmapLayerProps {
  center: [number, number];
  zoom: number;
  active: boolean;
}

type Period = "day" | "week" | "month" | "year" | "all";
type TimeOfDay = "all" | "morning" | "afternoon" | "evening" | "night";
type DayType = "all" | "weekday" | "weekend";

const PERIOD_LABELS: Record<Period, string> = {
  day: "Today",
  week: "Week",
  month: "Month",
  year: "Year",
  all: "All Time",
};

const TIME_LABELS: Record<TimeOfDay, string> = {
  all: "Any Time",
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
  night: "Night",
};

const DAY_LABELS: Record<DayType, string> = {
  all: "All Days",
  weekday: "Weekdays",
  weekend: "Weekends",
};

function latLngToWorldPoint(
  lat: number,
  lng: number,
  zoom: number
): { x: number; y: number } {
  const n = Math.pow(2, zoom);
  const tileSize = 512;
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

function tileCenterToLatLng(
  tileX: number,
  tileY: number,
  zoom: number
): { lat: number; lng: number } {
  const n = Math.pow(2, zoom);
  const lng = ((tileX + 0.5) / n) * 360 - 180;
  const latRad = Math.atan(
    Math.sinh(Math.PI * (1 - (2 * (tileY + 0.5)) / n))
  );
  const lat = (latRad * 180) / Math.PI;
  return { lat, lng };
}

export function HeatmapLayer({ center, zoom, active }: HeatmapLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tiles, setTiles] = useState<HeatmapTile[]>([]);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [loading, setLoading] = useState(false);

  const [period, setPeriod] = useState<Period>("all");
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>("all");
  const [dayType, setDayType] = useState<DayType>("all");
  const [showFilters, setShowFilters] = useState(false);

  const [centerLat, centerLng] = center;

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setSize({ width: Math.round(width), height: Math.round(height) });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const fetchTiles = useCallback(async () => {
    if (!active || !size.width || !size.height) return;

    const n = Math.pow(2, zoom);
    const tileSize = 512;
    const halfW = (size.width / 2 / tileSize / n) * 360;
    const halfH =
      (size.height /
        2 /
        tileSize /
        n /
        Math.cos((centerLat * Math.PI) / 180)) *
      180;

    const swLat = Math.max(-90, centerLat - halfH);
    const swLng = Math.max(-180, centerLng - halfW);
    const neLat = Math.min(90, centerLat + halfH);
    const neLng = Math.min(180, centerLng + halfW);

    const boundsStr = `${swLat},${swLng},${neLat},${neLng}`;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        bounds: boundsStr,
        zoom: String(zoom),
        period,
        timeOfDay,
        dayType,
      });
      const res = await fetch(`/api/heatmap?${params}`);
      if (!res.ok) {
        setTiles([]);
        return;
      }
      const json = await res.json();
      setTiles(json.data || []);
    } catch {
      setTiles([]);
    } finally {
      setLoading(false);
    }
  }, [active, size, centerLat, centerLng, zoom, period, timeOfDay, dayType]);

  useEffect(() => {
    fetchTiles();
  }, [fetchTiles]);

  useEffect(() => {
    if (!canvasRef.current || !size.width || !size.height) return;
    const canvas = canvasRef.current;
    canvas.width = size.width * devicePixelRatio;
    canvas.height = size.height * devicePixelRatio;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.scale(devicePixelRatio, devicePixelRatio);
    ctx.clearRect(0, 0, size.width, size.height);

    if (!active || tiles.length === 0) return;

    ctx.globalCompositeOperation = "multiply";

    for (const tile of tiles) {
      const centerPt = tileCenterToLatLng(
        tile.tileX,
        tile.tileY,
        zoom
      );
      const worldPt = latLngToWorldPoint(centerPt.lat, centerPt.lng, zoom);
      const centerWorld = latLngToWorldPoint(centerLat, centerLng, zoom);

      const screenX = size.width / 2 + (worldPt.x - centerWorld.x);
      const screenY = size.height / 2 + (worldPt.y - centerWorld.y);

      if (
        screenX < -50 ||
        screenX > size.width + 50 ||
        screenY < -50 ||
        screenY > size.height + 50
      ) {
        continue;
      }

      const radius = Math.max(8, 32 / (zoom + 1));
      const alpha = Math.min(tile.intensity * 0.8 + 0.1, 0.9);

      const gradient = ctx.createRadialGradient(
        screenX,
        screenY,
        0,
        screenX,
        screenY,
        radius
      );
      gradient.addColorStop(0, `rgba(255, 90, 31, ${alpha})`);
      gradient.addColorStop(0.4, `rgba(255, 90, 31, ${alpha * 0.6})`);
      gradient.addColorStop(0.7, `rgba(255, 90, 31, ${alpha * 0.2})`);
      gradient.addColorStop(1, "rgba(255, 90, 31, 0)");

      ctx.beginPath();
      ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
    }

    ctx.globalCompositeOperation = "source-over";
  }, [tiles, size, active, centerLat, centerLng, zoom]);

  if (!active) return null;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none z-[5]"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        style={{ width: size.width, height: size.height }}
      />

      {loading && (
        <div className="absolute top-3 right-3 pointer-events-auto">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
        </div>
      )}

      <div className="absolute top-3 left-3 pointer-events-auto z-10 flex flex-col gap-2">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "flex items-center gap-2 rounded-xl border border-border bg-card/80 backdrop-blur px-3 py-2 text-xs font-medium text-white/70 transition-colors hover:text-white cursor-pointer",
            showFilters && "border-primary/30 text-primary"
          )}
        >
          <Filter className="h-3.5 w-3.5" />
          Filters
          {(period !== "all" ||
            timeOfDay !== "all" ||
            dayType !== "all") && (
            <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] text-white">
              !
            </span>
          )}
        </button>
      </div>

      {showFilters && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute left-3 top-12 pointer-events-auto z-10 w-56 rounded-xl border border-border bg-card/95 backdrop-blur p-3 shadow-xl space-y-3"
        >
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-[10px] font-medium text-white/50 uppercase tracking-wider">
              <Calendar className="h-3 w-3" />
              Period
            </label>
            <div className="flex flex-wrap gap-1">
              {(["day", "week", "month", "year", "all"] as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer",
                    period === p
                      ? "bg-primary text-white"
                      : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                  )}
                >
                  {PERIOD_LABELS[p]}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-[10px] font-medium text-white/50 uppercase tracking-wider">
              <Sun className="h-3 w-3" />
              Time of Day
            </label>
            <div className="flex flex-wrap gap-1">
              {(
                ["all", "morning", "afternoon", "evening", "night"] as TimeOfDay[]
              ).map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeOfDay(t)}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer",
                    timeOfDay === t
                      ? "bg-primary text-white"
                      : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                  )}
                >
                  {TIME_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-[10px] font-medium text-white/50 uppercase tracking-wider">
              <Moon className="h-3 w-3" />
              Day Type
            </label>
            <div className="flex flex-wrap gap-1">
              {(["all", "weekday", "weekend"] as DayType[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setDayType(d)}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer",
                    dayType === d
                      ? "bg-primary text-white"
                      : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                  )}
                >
                  {DAY_LABELS[d]}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
