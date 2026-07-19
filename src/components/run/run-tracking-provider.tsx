"use client";

import React, { createContext, useCallback, useContext, useState } from "react";
import { useRouter } from "next/navigation";
import { useRunTracking, type TrackingState } from "@/hooks/use-run-tracking";
import { RunTrackingOverlay } from "@/components/run/run-tracking-overlay";

interface RunTrackingContextType {
  startRun: () => Promise<void>;
  isTracking: boolean;
  state: TrackingState;
}

const RunTrackingContext = createContext<RunTrackingContextType>({
  startRun: async () => {},
  isTracking: false,
  state: {
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
  },
});

export function useRunTrackingContext() {
  return useContext(RunTrackingContext);
}

export function RunTrackingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { state, startRun, stopRun, resetRun } = useRunTracking();
  const [overlayOpen, setOverlayOpen] = useState(false);

  const handleStartRun = useCallback(async () => {
    await startRun();
    setOverlayOpen(true);
  }, [startRun]);

  const handleClose = useCallback(async () => {
    if (state.status === "paused") {
      const activityId = await stopRun();
      if (activityId) {
        router.push(`/activities/${activityId}`);
      }
      setOverlayOpen(false);
      resetRun();
    } else if (state.status === "idle") {
      setOverlayOpen(false);
    }
  }, [state.status, stopRun, resetRun, router]);

  const handleRunComplete = useCallback(
    (activityId: string) => {
      router.push(`/activities/${activityId}`);
      setOverlayOpen(false);
      resetRun();
    },
    [router, resetRun]
  );

  const isTracking = state.status !== "idle";

  return (
    <RunTrackingContext.Provider
      value={{ startRun: handleStartRun, isTracking, state }}
    >
      <RunTrackingOverlay
        isOpen={overlayOpen}
        onClose={handleClose}
        onRunComplete={handleRunComplete}
        lastRun={null}
      />
      {children}
    </RunTrackingContext.Provider>
  );
}
