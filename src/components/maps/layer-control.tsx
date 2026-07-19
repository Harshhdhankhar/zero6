"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Thermometer,
  Cloud,
  Wind,
  AlertTriangle,
  Droplets,
  Route,
  MapPin,
  Calendar,
  Camera,
  Heart,
  Play,
  Building2,
} from "lucide-react";
import { useFetch } from "@/hooks/use-fetch";
import { cn } from "@/lib/utils";

export interface LayerState {
  heatmap: boolean;
  communityPhotos: boolean;
  routes: boolean;
  events: boolean;
  clubs: boolean;
  challenges: boolean;
  runningSpots: boolean;
  liveRuns: boolean;
  waterPoints: boolean;
  medical: boolean;
  weather: boolean;
  aqi: boolean;
  traffic: boolean;
}

const DEFAULT_LAYERS: LayerState = {
  heatmap: false,
  communityPhotos: false,
  routes: true,
  events: true,
  clubs: false,
  challenges: false,
  runningSpots: true,
  liveRuns: false,
  waterPoints: false,
  medical: false,
  weather: false,
  aqi: false,
  traffic: false,
};

interface LayerConfig {
  key: keyof LayerState;
  label: string;
  icon: React.ElementType;
}

const LAYER_CONFIGS: LayerConfig[] = [
  { key: "heatmap", label: "Heatmap", icon: Thermometer },
  { key: "communityPhotos", label: "Community Photos", icon: Camera },
  { key: "routes", label: "Routes", icon: Route },
  { key: "runningSpots", label: "Running Spots", icon: MapPin },
  { key: "liveRuns", label: "Live Runs", icon: Play },
  { key: "events", label: "Events", icon: Calendar },
  { key: "clubs", label: "Communities", icon: Building2 },
  { key: "challenges", label: "Challenges", icon: Heart },
  { key: "waterPoints", label: "Water Points", icon: Droplets },
  { key: "medical", label: "Medical", icon: Heart },
  { key: "weather", label: "Weather", icon: Cloud },
  { key: "aqi", label: "AQI", icon: Wind },
  { key: "traffic", label: "Traffic", icon: AlertTriangle },
];

interface LayerControlProps {
  open?: boolean;
  activeLayers: LayerState;
  onLayersChange: (layers: LayerState) => void;
}

export function LayerControl({
  open,
  activeLayers,
  onLayersChange,
}: LayerControlProps) {
  const toggleLayer = useCallback(
    (key: keyof LayerState) => {
      const updated = { ...activeLayers, [key]: !activeLayers[key] };
      onLayersChange(updated);
      fetch("/api/maps/layers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      }).catch(() => {});
    },
    [activeLayers, onLayersChange]
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="space-y-1"
          role="group"
          aria-label="Map layers"
        >
          {LAYER_CONFIGS.map((layer) => {
            const isActive = activeLayers[layer.key];
            const Icon = layer.icon;
            return (
              <button
                key={layer.key}
                onClick={() => toggleLayer(layer.key)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all cursor-pointer",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-white/40 hover:bg-white/[0.04] hover:text-white"
                )}
                aria-pressed={isActive}
                aria-label={`Toggle ${layer.label}`}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{layer.label}</span>
                <div
                  className={cn(
                    "ml-auto h-5 w-9 rounded-full border transition-colors",
                    isActive
                      ? "bg-primary border-primary"
                      : "bg-white/5 border-border"
                  )}
                >
                  <div
                    className={cn(
                      "h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
                      isActive ? "translate-x-4" : "translate-x-0.5"
                    )}
                  />
                </div>
              </button>
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function useLayers() {
  const { data: serverLayers, loading } = useFetch<Partial<LayerState>>("/api/maps/layers");
  const [layers, setLayers] = useState<LayerState>(DEFAULT_LAYERS);

  useEffect(() => {
    if (serverLayers) {
      setLayers({ ...DEFAULT_LAYERS, ...serverLayers });
    }
  }, [serverLayers]);

  return { layers, setLayers, loading, defaults: DEFAULT_LAYERS };
}
