"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export interface TrackingState {
  status: "idle" | "starting" | "active" | "paused" | "stopping" | "completed";
  sessionId: string | null;
  activityId: string | null;
  elapsed: number;
  distance: number;
  currentPace: number;
  averagePace: number;
  calories: number;
  elevationGain: number;
  waypoints: GeolocationCoordinates[];
  splits: Array<{ distance: number; pace: number; duration: number }>;
  error: string | null;
}

export interface UseRunTrackingReturn {
  state: TrackingState;
  startRun: () => Promise<void>;
  pauseRun: () => void;
  resumeRun: () => void;
  stopRun: (title?: string) => Promise<string | null>;
  resetRun: () => void;
  watchId: number | null;
}

interface InternalWaypoint {
  coords: GeolocationCoordinates;
  timestamp: number;
}

const EARTH_RADIUS_M = 6371000;
const DEFAULT_WEIGHT_KG = 70;
const MET_RUNNING = 8;
const BATCH_SIZE = 10;
const BATCH_INTERVAL_MS = 10000;
const PACE_WINDOW_MS = 30000;
const ELAPSED_INTERVAL_MS = 1000;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function haversine(a: GeolocationCoordinates, b: GeolocationCoordinates): number {
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const aVal =
    sinDLat * sinDLat +
    Math.cos(toRad(a.latitude)) *
      Math.cos(toRad(b.latitude)) *
      sinDLon *
      sinDLon;
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal));
}

function initialTrackingState(): TrackingState {
  return {
    status: "idle",
    sessionId: null,
    activityId: null,
    elapsed: 0,
    distance: 0,
    currentPace: 0,
    averagePace: 0,
    calories: 0,
    elevationGain: 0,
    waypoints: [],
    splits: [],
    error: null,
  };
}

export function useRunTracking(): UseRunTrackingReturn {
  const [state, setState] = useState<TrackingState>(initialTrackingState);
  const [watchId, setWatchId] = useState<number | null>(null);

  const startTimeRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);
  const pausedDurationRef = useRef<number>(0);
  const waypointBufferRef = useRef<InternalWaypoint[]>([]);
  const allWaypointsRef = useRef<InternalWaypoint[]>([]);
  const lastBatchUploadRef = useRef<number>(0);
  const sessionIdRef = useRef<string | null>(null);
  const isFlushingRef = useRef<boolean>(false);
  const lastSplitDistanceRef = useRef<number>(0);

  const flushBuffer = useCallback(async () => {
    if (isFlushingRef.current) return;
    isFlushingRef.current = true;
    try {
      const buffer = waypointBufferRef.current;
      if (buffer.length === 0 || !sessionIdRef.current) return;

      waypointBufferRef.current = [];
      lastBatchUploadRef.current = Date.now();

      const waypoints = buffer.map((wp) => ({
        latitude: wp.coords.latitude,
        longitude: wp.coords.longitude,
        altitude: wp.coords.altitude ?? 0,
        accuracy: wp.coords.accuracy,
        speed: wp.coords.speed ?? 0,
        timestamp: new Date(wp.timestamp).toISOString(),
      }));

      await fetch("/api/tracking/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sessionIdRef.current, waypoints }),
      });
    } catch {
      /* non-critical */
    } finally {
      isFlushingRef.current = false;
    }
  }, []);

  const handlePosition = useCallback(
    (position: GeolocationPosition) => {
      const wp: InternalWaypoint = {
        coords: position.coords,
        timestamp: position.timestamp,
      };

      allWaypointsRef.current.push(wp);
      waypointBufferRef.current.push(wp);

      const allWps = allWaypointsRef.current;
      const len = allWps.length;

      let deltaDistM = 0;
      let deltaElev = 0;

      if (len >= 2) {
        const prev = allWps[len - 2];
        const curr = allWps[len - 1];
        deltaDistM = haversine(prev.coords, curr.coords);
        const altDiff = (curr.coords.altitude ?? 0) - (prev.coords.altitude ?? 0);
        if (altDiff > 0) deltaElev = altDiff;
      }

      const now = Date.now();
      const elapsed = (now - startTimeRef.current - pausedDurationRef.current) / 1000;

      setState((prev) => {
        const distanceKm = prev.distance + deltaDistM / 1000;
        const elevationGain = prev.elevationGain + deltaElev;

        let currentPace = 0;
        const recent = allWps.filter((w) => now - w.timestamp <= PACE_WINDOW_MS);
        if (recent.length >= 2) {
          const windowDuration = (recent[recent.length - 1].timestamp - recent[0].timestamp) / 1000;
          let windowDist = 0;
          for (let i = 1; i < recent.length; i++) {
            windowDist += haversine(recent[i - 1].coords, recent[i].coords);
          }
          if (windowDist > 0 && windowDuration > 0) {
            currentPace = (windowDuration / 60) / (windowDist / 1000);
          }
        }

        const averagePace =
          distanceKm > 0 && elapsed > 0
            ? (elapsed / 60) / distanceKm
            : 0;

        const calories = (elapsed / 3600) * MET_RUNNING * DEFAULT_WEIGHT_KG;

        const newSplits = prev.splits.slice();
        if (distanceKm - lastSplitDistanceRef.current >= 1) {
          const splitDist = distanceKm - lastSplitDistanceRef.current;
          const splitDuration =
            newSplits.length > 0
              ? elapsed - newSplits.reduce((s, sp) => s + sp.duration, 0)
              : elapsed;
          const splitPace = splitDist > 0 ? (splitDuration / 60) / splitDist : 0;
          newSplits.push({
            distance: splitDist,
            pace: splitPace,
            duration: splitDuration,
          });
          lastSplitDistanceRef.current = distanceKm;
        }

        return {
          ...prev,
          elapsed,
          distance: distanceKm,
          currentPace,
          averagePace,
          calories,
          elevationGain,
          waypoints: [...prev.waypoints, position.coords],
          splits: newSplits,
        };
      });

      if (
        waypointBufferRef.current.length >= BATCH_SIZE ||
        Date.now() - lastBatchUploadRef.current >= BATCH_INTERVAL_MS
      ) {
        flushBuffer();
      }
    },
    [flushBuffer]
  );

  const handleError = useCallback((err: GeolocationPositionError) => {
    setState((prev) => ({ ...prev, error: err.message }));
  }, []);

  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({ ...prev, error: "Geolocation not supported" }));
      return null;
    }
    const id = navigator.geolocation.watchPosition(
      handlePosition,
      handleError,
      { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
    );
    setWatchId(id);
    return id;
  }, [handlePosition, handleError]);

  const stopWatching = useCallback(() => {
    setWatchId((prev) => {
      if (prev !== null) {
        navigator.geolocation.clearWatch(prev);
      }
      return null;
    });
  }, []);

  const startRun = useCallback(async () => {
    setState((prev) => ({ ...prev, status: "starting", error: null }));

    try {
      const res = await fetch("/api/tracking/start", { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || `HTTP ${res.status}`);
      }
      const json = await res.json();
      const { sessionId, startTime } = json.data;

      sessionIdRef.current = sessionId;
      startTimeRef.current = new Date(startTime).getTime();
      pausedDurationRef.current = 0;
      pausedAtRef.current = 0;
      lastSplitDistanceRef.current = 0;
      allWaypointsRef.current = [];
      waypointBufferRef.current = [];
      lastBatchUploadRef.current = Date.now();

      setState({
        status: "active",
        sessionId,
        activityId: null,
        elapsed: 0,
        distance: 0,
        currentPace: 0,
        averagePace: 0,
        calories: 0,
        elevationGain: 0,
        waypoints: [],
        splits: [],
        error: null,
      });

      startWatching();
    } catch (err: any) {
      setState((prev) => ({
        ...prev,
        status: "idle",
        error: err.message || "Failed to start run",
      }));
    }
  }, [startWatching]);

  const pauseRun = useCallback(() => {
    pausedAtRef.current = Date.now();
    stopWatching();
    setState((prev) => ({ ...prev, status: "paused" }));
  }, [stopWatching]);

  const resumeRun = useCallback(() => {
    if (pausedAtRef.current > 0) {
      pausedDurationRef.current += Date.now() - pausedAtRef.current;
      pausedAtRef.current = 0;
    }
    setState((prev) => ({ ...prev, status: "active" }));
    startWatching();
  }, [startWatching]);

  const stopRun = useCallback(
    async (title?: string): Promise<string | null> => {
      setState((prev) => {
        if (prev.status !== "active" && prev.status !== "paused") return prev;
        return { ...prev, status: "stopping" };
      });
      stopWatching();

      const sid = sessionIdRef.current;
      if (!sid) return null;
      sessionIdRef.current = null;

      await flushBuffer();

      try {
        const res = await fetch("/api/tracking/stop", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: sid,
            title: title ?? undefined,
            isPublic: true,
          }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error || `HTTP ${res.status}`);
        }
        const json = await res.json();
        const { activityId } = json.data;

        setState((prev) => ({
          ...prev,
          status: "completed",
          activityId,
        }));

        return activityId;
      } catch (err: any) {
        setState((prev) => ({
          ...prev,
          status: "paused",
          error: err.message || "Failed to stop run",
        }));
        return null;
      }
    },
    [stopWatching, flushBuffer]
  );

  const resetRun = useCallback(() => {
    stopWatching();
    sessionIdRef.current = null;
    startTimeRef.current = 0;
    pausedAtRef.current = 0;
    pausedDurationRef.current = 0;
    allWaypointsRef.current = [];
    waypointBufferRef.current = [];
    lastBatchUploadRef.current = 0;
    lastSplitDistanceRef.current = 0;
    setState(initialTrackingState());
  }, [stopWatching]);

  useEffect(() => {
    if (state.status !== "active") return;
    const id = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current - pausedDurationRef.current) / 1000;
      setState((prev) => {
        if (prev.status !== "active") return prev;
        return { ...prev, elapsed };
      });
    }, ELAPSED_INTERVAL_MS);
    return () => clearInterval(id);
  }, [state.status]);

  useEffect(() => {
    if (state.status !== "active") return;
    const id = setInterval(() => {
      flushBuffer();
    }, BATCH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [state.status, flushBuffer]);

  useEffect(() => {
    return () => {
      stopWatching();
    };
  }, [stopWatching]);

  return {
    state,
    startRun,
    pauseRun,
    resumeRun,
    stopRun,
    resetRun,
    watchId,
  };
}
