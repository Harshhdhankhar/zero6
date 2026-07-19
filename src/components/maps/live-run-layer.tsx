"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Smile, RefreshCw } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatPace, formatDuration } from "@/lib/utils";
import { toast } from "sonner";

interface LiveRun {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  status: string;
  currentLatitude: number;
  currentLongitude: number;
  currentPace: number;
  averagePace: number;
  distance: number;
  duration: number;
  elevationGain: number;
  visibility: string;
  allowCheers: boolean;
  startedAt: string;
}

interface LiveRunLayerProps {
  center: [number, number];
  zoom: number;
  active: boolean;
  onRunClick?: (run: LiveRun) => void;
}

const REACTIONS = [
  { type: "cheer", label: "Cheer", emoji: "👏" },
  { type: "fire", label: "Fire", emoji: "🔥" },
  { type: "clap", label: "Clap", emoji: "👏" },
  { type: "wave", label: "Wave", emoji: "👋" },
  { type: "good_job", label: "Good Job", emoji: "💪" },
  { type: "keep_going", label: "Keep Going", emoji: "🏃" },
];

function LiveRunPopup({ run, onClose }: { run: LiveRun; onClose: () => void }) {
  const [showReactions, setShowReactions] = useState(false);
  const [cheered, setCheered] = useState(false);

  async function handleCheer(reactionType: string) {
    try {
      const res = await fetch(`/api/live-runs/${run.id}/cheer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reactionType }),
      });
      if (!res.ok) throw new Error("Failed to cheer");
      setCheered(true);
      setShowReactions(false);
      toast.success("Cheer sent!");
    } catch {
      toast.error("Failed to send cheer");
    }
  }

  return (
    <div className="w-64 rounded-xl border border-border bg-card p-4 shadow-2xl">
      <div className="mb-3 flex items-start gap-3">
        <Avatar className="h-10 w-10 shrink-0 ring-2 ring-primary/50">
          <AvatarImage src={run.userAvatar} alt={run.userName} />
          <AvatarFallback className="text-xs">{run.userName.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h4 className="font-semibold text-white truncate">{run.userName}</h4>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-emerald-400">Live</span>
          </div>
        </div>
        <button onClick={onClose} className="cursor-pointer rounded-lg p-1 text-white/50 hover:bg-white/10 hover:text-white" aria-label="Close">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-white/5 px-2.5 py-2 text-center">
          <p className="text-xs text-white/40">Pace</p>
          <p className="text-sm font-bold text-white">{formatPace(run.averagePace)}</p>
        </div>
        <div className="rounded-lg bg-white/5 px-2.5 py-2 text-center">
          <p className="text-xs text-white/40">Duration</p>
          <p className="text-sm font-bold text-white">{formatDuration(run.duration)}</p>
        </div>
        <div className="rounded-lg bg-white/5 px-2.5 py-2 text-center">
          <p className="text-xs text-white/40">Distance</p>
          <p className="text-sm font-bold text-white">{(run.distance / 1000).toFixed(2)}km</p>
        </div>
        <div className="rounded-lg bg-white/5 px-2.5 py-2 text-center">
          <p className="text-xs text-white/40">Elevation</p>
          <p className="text-sm font-bold text-white">{run.elevationGain}m</p>
        </div>
      </div>

      {run.allowCheers && (
        <div className="relative">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowReactions(!showReactions)}
            className="w-full gap-2 rounded-lg text-xs"
            disabled={cheered}
          >
            {cheered ? <>Cheered! 🎉</> : <><Smile className="h-3.5 w-3.5" /> Cheer</>}
          </Button>
          <AnimatePresence>
            {showReactions && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="absolute bottom-full mb-2 left-0 right-0 flex flex-wrap gap-1 rounded-xl border border-border bg-card p-2 shadow-xl"
              >
                {REACTIONS.map((r) => (
                  <button
                    key={r.type}
                    onClick={() => handleCheer(r.type)}
                    className="flex flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-xs transition-colors hover:bg-white/10 cursor-pointer"
                    aria-label={`Send ${r.label}`}
                  >
                    <span className="text-lg">{r.emoji}</span>
                    <span className="text-[10px] text-white/50">{r.label}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function latLngToScreenPoint(
  lat: number,
  lng: number,
  centerLat: number,
  centerLng: number,
  zoom: number,
  width: number,
  height: number
): { x: number; y: number } | null {
  const n = Math.pow(2, zoom);
  const tileSize = 512;
  const toWorld = (la: number, lo: number) => {
    const x = ((lo + 180) / 360) * n * tileSize;
    const y = ((1 - Math.log(Math.tan((la * Math.PI) / 180) + 1 / Math.cos((la * Math.PI) / 180)) / Math.PI) / 2) * n * tileSize;
    return { x, y };
  };
  const c = toWorld(centerLat, centerLng);
  const p = toWorld(lat, lng);
  const sx = width / 2 + (p.x - c.x);
  const sy = height / 2 + (p.y - c.y);
  if (sx < -50 || sx > width + 50 || sy < -50 || sy > height + 50) return null;
  return { x: sx, y: sy };
}

export function LiveRunLayer({ center, zoom, active, onRunClick }: LiveRunLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [selectedRun, setSelectedRun] = useState<LiveRun | null>(null);
  const [runs, setRuns] = useState<LiveRun[]>([]);
  const [loading, setLoading] = useState(false);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const [centerLat, centerLng] = center;

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setSize({ width: Math.round(entry.contentRect.width), height: Math.round(entry.contentRect.height) });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const fetchRuns = useCallback(async () => {
    if (!active) return;
    try {
      setLoading(true);
      const res = await fetch("/api/live-runs");
      if (res.ok) {
        const json = await res.json();
        setRuns(json.data || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [active]);

  useEffect(() => {
    fetchRuns();
    if (active) {
      pollRef.current = setInterval(fetchRuns, 15000);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [active, fetchRuns]);

  const activeRuns = (runs || []).filter((r) => r.status === "active");

  useEffect(() => {
    if (!canvasRef.current || !size.width || !size.height) return;
    const canvas = canvasRef.current;
    canvas.width = size.width * devicePixelRatio;
    canvas.height = size.height * devicePixelRatio;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(devicePixelRatio, devicePixelRatio);
    ctx.clearRect(0, 0, size.width, size.height);

    if (!active || activeRuns.length === 0) return;

    for (const run of activeRuns) {
      if (!run.currentLatitude || !run.currentLongitude) continue;
      const pt = latLngToScreenPoint(run.currentLatitude, run.currentLongitude, centerLat, centerLng, zoom, size.width, size.height);
      if (!pt) continue;

      const pulseRadius = Math.max(6, 14 - zoom);
      const gradient = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, pulseRadius * 2);
      gradient.addColorStop(0, "rgba(16, 185, 129, 0.5)");
      gradient.addColorStop(0.5, "rgba(16, 185, 129, 0.2)");
      gradient.addColorStop(1, "rgba(16, 185, 129, 0)");
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pulseRadius * 2, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pulseRadius, 0, Math.PI * 2);
      ctx.fillStyle = "#10B981";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pulseRadius * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.fill();

      const arrowSize = 4;
      ctx.beginPath();
      ctx.moveTo(pt.x, pt.y - pulseRadius - arrowSize);
      ctx.lineTo(pt.x - arrowSize, pt.y - pulseRadius + arrowSize);
      ctx.lineTo(pt.x + arrowSize, pt.y - pulseRadius + arrowSize);
      ctx.closePath();
      ctx.fillStyle = "#10B981";
      ctx.fill();
    }
  }, [activeRuns, size, active, centerLat, centerLng, zoom]);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!active || activeRuns.length === 0) return;
      const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      for (const run of activeRuns) {
        if (!run.currentLatitude || !run.currentLongitude) continue;
        const pt = latLngToScreenPoint(run.currentLatitude, run.currentLongitude, centerLat, centerLng, zoom, size.width, size.height);
        if (!pt) continue;
        const radius = Math.max(6, 14 - zoom);
        const dist = Math.sqrt((x - pt.x) ** 2 + (y - pt.y) ** 2);
        if (dist <= radius) {
          setSelectedRun(run);
          onRunClick?.(run);
          return;
        }
      }
    },
    [active, activeRuns, centerLat, centerLng, zoom, size, onRunClick]
  );

  if (!active) return null;

  return (
    <div ref={containerRef} className="absolute inset-0 z-[6] pointer-events-none">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full pointer-events-auto cursor-pointer"
        style={{ width: size.width, height: size.height }}
        onClick={handleCanvasClick}
      />
      {loading && activeRuns.length === 0 && (
        <div className="absolute right-3 top-3 pointer-events-auto">
          <RefreshCw className="h-4 w-4 text-emerald-400 animate-spin" />
        </div>
      )}
      {activeRuns.length === 0 && !loading && (
        <div className="absolute right-3 top-3 pointer-events-auto">
          <span className="text-[10px] text-white/40 bg-black/60 px-2 py-1 rounded-lg">No active runs</span>
        </div>
      )}
      <AnimatePresence>
        {selectedRun && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 pointer-events-auto"
          >
            <LiveRunPopup run={selectedRun} onClose={() => setSelectedRun(null)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
