"use client";

import React, { useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  Square,
  Map,
  Activity,
  Flame,
  Mountain,
  Loader2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRunTracking } from "@/hooks/use-run-tracking";

interface RunTrackingOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onRunComplete: (activityId: string) => void;
  lastRun?: { distance: number; duration: number; date: string } | null;
}

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.round(seconds % 60);
  if (h > 0) {
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function formatRunPace(minPerKm: number): string {
  if (!minPerKm || minPerKm <= 0) return "--:-- /km";
  const minutes = Math.floor(minPerKm);
  const seconds = Math.round((minPerKm - minutes) * 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")} /km`;
}

function formatDurationShort(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${Math.round(seconds)}s`;
}

function StatPill({
  label,
  value,
  unit,
  icon: Icon,
}: {
  label: string;
  value: string;
  unit?: string;
  icon: React.ElementType;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm font-bold tabular-nums">
        {value}
        {unit && (
          <span className="text-xs font-medium text-muted-foreground ml-0.5">
            {unit}
          </span>
        )}
      </span>
      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

export function RunTrackingOverlay({
  isOpen,
  onClose,
  onRunComplete,
  lastRun,
}: RunTrackingOverlayProps) {
  const { state, startRun, pauseRun, resumeRun, stopRun } = useRunTracking();
  const {
    status,
    elapsed,
    distance,
    currentPace,
    averagePace,
    calories,
    elevationGain,
    error,
    activityId,
  } = state;

  const idle = status === "idle";
  const starting = status === "starting";
  const active = status === "active";
  const paused = status === "paused";
  const stopping = status === "stopping";
  const completed = status === "completed";
  const isRunning = active || paused;

  useEffect(() => {
    if (completed && activityId) {
      onRunComplete(activityId);
    }
  }, [completed, activityId, onRunComplete]);

  const handleStop = useCallback(async () => {
    await stopRun();
  }, [stopRun]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="run-tracking-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex flex-col bg-background"
        >
          {/* Close button — only available in idle/starting */}
          {(idle || starting) && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-secondary/50 backdrop-blur-sm border border-border/50 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {/* Error banner */}
          {error && (
            <div className="absolute top-4 left-4 right-16 z-10 rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-2.5 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* ─── IDLE / STARTING ─── */}
          {(idle || starting) && (
            <div className="flex flex-1 flex-col items-center justify-center px-6">
              <motion.div
                key="idle-content"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="flex flex-col items-center gap-8"
              >
                {/* Start button with pulse ring */}
                <div className="relative">
                  {idle && (
                    <motion.div
                      className="absolute inset-0 rounded-full bg-primary/20"
                      animate={{ scale: [1, 1.35, 1] }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  )}
                  <button
                    onClick={startRun}
                    disabled={starting}
                    className="relative flex h-28 w-28 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform active:scale-90 hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {starting ? (
                      <Loader2 className="h-10 w-10 animate-spin" />
                    ) : (
                      <Play className="h-10 w-10 ml-1" fill="currentColor" />
                    )}
                  </button>
                </div>

                <span className="text-lg font-medium text-muted-foreground">
                  {starting ? "Starting..." : "Tap to Start"}
                </span>

                {/* Last run preview */}
                {idle && lastRun && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                    className="mt-2 w-full max-w-xs rounded-2xl border border-border/50 bg-card/50 p-4 backdrop-blur-sm"
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      Last Run
                    </span>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Map className="h-3.5 w-3.5 text-primary" />
                        <span className="text-sm font-semibold">
                          {lastRun.distance.toFixed(2)} km
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {formatDurationShort(lastRun.duration)}
                        </span>
                      </div>
                    </div>
                    <div className="mt-1 text-[10px] text-muted-foreground">
                      {new Date(lastRun.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </div>
          )}

          {/* ─── ACTIVE / PAUSED / STOPPING ─── */}
          {(isRunning || stopping) && (
            <div
              className={cn(
                "flex flex-1 flex-col px-6 py-16 relative",
                paused && "blur-sm"
              )}
            >
              {/* Paused badge */}
              {paused && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-4 left-0 right-0 flex justify-center z-10"
                  style={{ filter: "none" }}
                >
                  <span className="inline-flex items-center gap-2 rounded-full bg-warning/10 border border-warning/20 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-warning">
                    <span className="h-2 w-2 rounded-full bg-warning animate-pulse" />
                    Paused
                  </span>
                </motion.div>
              )}

              {/* Stopping overlay */}
              {stopping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 z-20 flex items-center justify-center bg-background/80 backdrop-blur-sm"
                  style={{ filter: "none" }}
                >
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <span className="text-sm font-medium text-muted-foreground">
                      Saving your run...
                    </span>
                  </div>
                </motion.div>
              )}

              {/* Timer */}
              <div className="flex justify-center mt-8">
                <span
                  className={cn(
                    "text-6xl sm:text-7xl font-bold tabular-nums tracking-tight transition-opacity",
                    paused && "opacity-40"
                  )}
                >
                  {formatElapsed(elapsed)}
                </span>
              </div>

              {/* Distance */}
              <div className="flex justify-center mt-6">
                <span className="text-4xl sm:text-5xl font-bold tabular-nums tracking-tight">
                  {distance.toFixed(2)}
                </span>
                <span className="text-2xl font-semibold text-muted-foreground ml-2 self-end pb-1">
                  km
                </span>
              </div>

              {/* Pace row */}
              <div className="flex justify-center gap-8 sm:gap-12 mt-8">
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Current Pace
                  </span>
                  <span className="text-lg sm:text-xl font-bold tabular-nums mt-1">
                    {formatRunPace(currentPace)}
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Avg Pace
                  </span>
                  <span className="text-lg sm:text-xl font-bold tabular-nums mt-1">
                    {formatRunPace(averagePace)}
                  </span>
                </div>
              </div>

              {/* Quick stats row */}
              <div className="flex justify-center gap-8 sm:gap-12 mt-8">
                <StatPill
                  label="Calories"
                  value={Math.round(calories).toString()}
                  icon={Flame}
                />
                <StatPill
                  label="Elevation"
                  value={elevationGain.toFixed(0)}
                  icon={Mountain}
                  unit="m"
                />
                <StatPill
                  label="Duration"
                  value={formatDurationShort(elapsed)}
                  icon={Activity}
                />
              </div>
            </div>
          )}

          {/* ─── CONTROLS (active/paused) ─── */}
          {isRunning && !stopping && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center gap-6 pb-12 pt-4"
            >
              {paused ? (
                <>
                  <button
                    onClick={resumeRun}
                    className="flex h-16 w-16 items-center justify-center rounded-full bg-success text-success-foreground shadow-lg shadow-success/25 transition-transform active:scale-90 hover:scale-105"
                    aria-label="Resume"
                  >
                    <Play className="h-7 w-7 ml-0.5" fill="currentColor" />
                  </button>
                  <button
                    onClick={handleStop}
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-lg transition-transform active:scale-90 hover:scale-105"
                    aria-label="Save Run"
                  >
                    <Square className="h-5 w-5" fill="currentColor" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={pauseRun}
                    className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-secondary-foreground border border-border shadow-lg transition-transform active:scale-90 hover:scale-105"
                    aria-label="Pause"
                  >
                    <Pause className="h-7 w-7" fill="currentColor" />
                  </button>
                  <button
                    onClick={handleStop}
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-lg transition-transform active:scale-90 hover:scale-105"
                    aria-label="Stop"
                  >
                    <Square className="h-4 w-4" fill="currentColor" />
                  </button>
                </>
              )}
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
