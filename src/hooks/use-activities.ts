"use client";

import { useCallback, useState, useEffect } from "react";

export function useActivities() {
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/activities");
      const json = await res.json();
      setActivities(json.data);
    } catch {
      setError("Failed to load activities");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createActivity = useCallback(async (data: Record<string, unknown>) => {
    try {
      const res = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      setActivities((prev) => [json.data, ...prev]);
      return json.data;
    } catch {
      setError("Failed to create activity");
      return null;
    }
  }, []);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  return { activities, isLoading, error, refetch: fetchActivities, createActivity };
}
