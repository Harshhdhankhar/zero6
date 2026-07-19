"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Users, Activity, Calendar, Route, TreePine, Cloud, Wind, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

interface NearbyData {
  currentArea: string;
  activeCommunities: number;
  liveRunners: number;
  eventsToday: number;
  recommendedRoute: { name: string; distance: string } | null;
  bestRunningArea: { name: string; rating: number } | null;
  weather: { temp: number; condition: string } | null;
  aqi: number | null;
}

export function NearbyRunningSummary() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<NearbyData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchNearbyData() {
      try {
        setLoading(true);
        setError(false);

        const response = await fetch("/api/maps/discovery");
        if (!response.ok) throw new Error("Failed to fetch nearby data");
        
        const discoveryData = await response.json();
        
        setData({
          currentArea: discoveryData.city || "Unknown",
          activeCommunities: discoveryData.nearby_communities || 0,
          liveRunners: discoveryData.live_runners || 0,
          eventsToday: discoveryData.events_today || 0,
          recommendedRoute: discoveryData.recommended_route || null,
          bestRunningArea: discoveryData.best_spot || null,
          weather: discoveryData.weather || null,
          aqi: discoveryData.aqi || null,
        });
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    fetchNearbyData();
  }, []);

  if (loading) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="heading-md text-lg">Nearby Running</h3>
          <Link href="/maps">
            <Button variant="ghost" size="sm" className="gap-2">
              <MapPin className="h-4 w-4" />
              View Map
            </Button>
          </Link>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <MapPin className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            Enable location to see nearby running activity
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="heading-md text-lg">Nearby Running</h3>
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {data.currentArea}
          </p>
        </div>
        <Link href="/maps">
          <Button variant="ghost" size="sm" className="gap-2">
            View Full Map
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Active Communities */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-secondary/50 rounded-xl p-3 border border-border"
        >
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-4 w-4 text-blue-400" />
            <span className="text-xs text-muted-foreground">Active Communities</span>
          </div>
          <p className="text-xl font-bold text-foreground">{data.activeCommunities}</p>
        </motion.div>

        {/* Live Runners */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05 }}
          className="bg-secondary/50 rounded-xl p-3 border border-border"
        >
          <div className="flex items-center gap-2 mb-1">
            <Activity className="h-4 w-4 text-green-400" />
            <span className="text-xs text-muted-foreground">Live Runners</span>
          </div>
          <p className="text-xl font-bold text-foreground">{data.liveRunners}</p>
        </motion.div>

        {/* Events Today */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-secondary/50 rounded-xl p-3 border border-border"
        >
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="h-4 w-4 text-purple-400" />
            <span className="text-xs text-muted-foreground">Events Today</span>
          </div>
          <p className="text-xl font-bold text-foreground">{data.eventsToday}</p>
        </motion.div>

        {/* Weather */}
        {data.weather && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            className="bg-secondary/50 rounded-xl p-3 border border-border"
          >
            <div className="flex items-center gap-2 mb-1">
              <Cloud className="h-4 w-4 text-yellow-400" />
              <span className="text-xs text-muted-foreground">Weather</span>
            </div>
            <p className="text-lg font-bold text-foreground">{data.weather.temp}°C</p>
            <p className="text-[10px] text-muted-foreground">{data.weather.condition}</p>
          </motion.div>
        )}
      </div>

      {/* Recommended Route */}
      {data.recommendedRoute && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-3 bg-gradient-to-r from-primary/10 to-transparent rounded-xl p-3 border border-primary/20"
        >
          <div className="flex items-center gap-2 mb-1">
            <Route className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground">Recommended Route</span>
          </div>
          <p className="text-sm font-medium text-foreground truncate">{data.recommendedRoute.name}</p>
          <p className="text-xs text-muted-foreground">{data.recommendedRoute.distance}</p>
        </motion.div>
      )}

      {/* Best Running Area */}
      {data.bestRunningArea && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mt-3 bg-secondary/50 rounded-xl p-3 border border-border"
        >
          <div className="flex items-center gap-2 mb-1">
            <TreePine className="h-4 w-4 text-green-400" />
            <span className="text-xs text-muted-foreground">Best Running Area</span>
          </div>
          <p className="text-sm font-medium text-foreground truncate">{data.bestRunningArea.name}</p>
          <p className="text-xs text-muted-foreground">★ {data.bestRunningArea.rating.toFixed(1)}</p>
        </motion.div>
      )}

      {/* AQI */}
      {data.aqi !== null && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-3 flex items-center justify-between bg-secondary/50 rounded-xl p-3 border border-border"
        >
          <div className="flex items-center gap-2">
            <Wind className="h-4 w-4 text-cyan-400" />
            <span className="text-xs text-muted-foreground">Air Quality</span>
          </div>
          <span className={`text-sm font-bold ${
            data.aqi <= 50 ? 'text-green-500' :
            data.aqi <= 100 ? 'text-yellow-500' :
            data.aqi <= 150 ? 'text-orange-500' :
            'text-red-500'
          }`}>
            {data.aqi} AQI
          </span>
        </motion.div>
      )}
    </div>
  );
}
