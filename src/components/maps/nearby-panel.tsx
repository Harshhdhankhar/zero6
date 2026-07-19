"use client";

import React, { useState, useEffect } from "react";
import {
  MapPin,
  Navigation,
  Coffee,
  Train,
  Hospital,
  Droplets,
  Store,
  Shield,
  Users,
  Calendar,
  Route,
  Loader2,
  AlertCircle,
  X,
  Crosshair,
} from "lucide-react";
import { useFetch } from "@/hooks/use-fetch";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface NearbyItem {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  distance: number;
  category?: string;
  phone?: string;
  address?: string;
  spotType?: string;
  averageRating?: number;
}

interface NearbyData {
  spots: NearbyItem[];
  pois: Record<string, NearbyItem[]>;
  liveRuns: NearbyItem[];
  events: NearbyItem[];
  routes: NearbyItem[];
}

interface NearbyPanelProps {
  onItemClick?: (item: NearbyItem) => void;
  onClose?: () => void;
}

const POI_ICONS: Record<string, React.ElementType> = {
  cafe: Coffee,
  metro: Train,
  hospital: Hospital,
  pharmacy: Hospital,
  running_store: Store,
  sports_shop: Store,
  water_station: Droplets,
  public_toilet: Droplets,
  medical_facility: Hospital,
  police_station: Shield,
};

const POI_LABELS: Record<string, string> = {
  cafe: "Cafes",
  metro: "Metro",
  hospital: "Hospitals",
  pharmacy: "Pharmacies",
  running_store: "Running Stores",
  sports_shop: "Sports Shops",
  water_station: "Water Stations",
  public_toilet: "Public Toilets",
  medical_facility: "Medical Facilities",
  police_station: "Police Stations",
};

function NearbySection({
  title,
  icon: Icon,
  items,
  onItemClick,
  className,
}: {
  title: string;
  icon: React.ElementType;
  items: NearbyItem[];
  onItemClick?: (item: NearbyItem) => void;
  className?: string;
}) {
  if (items.length === 0) return null;
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2 text-xs font-semibold text-white/50 uppercase tracking-wider">
        <Icon className="h-3.5 w-3.5" />
        {title} ({items.length})
      </div>
      {items.map((item) => (
        <button
          key={`${title}-${item.id}`}
          onClick={() => onItemClick?.(item)}
          className="flex w-full items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5 text-left transition-colors hover:bg-white/[0.06] cursor-pointer"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
            <Icon className="h-4 w-4 text-white/60" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white truncate">{item.name}</p>
            <p className="text-xs text-white/40">{item.distance?.toFixed(2)} km</p>
          </div>
          <Navigation className="h-3.5 w-3.5 shrink-0 text-white/30" />
        </button>
      ))}
    </div>
  );
}

export function NearbyPanel({ onItemClick, onClose }: NearbyPanelProps) {
  const [gpsPosition, setGpsPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsLoading, setGpsLoading] = useState(true);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setGpsError("Geolocation not supported");
      setGpsLoading(false);
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setGpsPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsError(null);
        setGpsLoading(false);
      },
      (err) => {
        setGpsError(err.message);
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const queryString = gpsPosition
    ? `lat=${gpsPosition.lat}&lng=${gpsPosition.lng}&radius=5`
    : "";

  const { data, loading, error } = useFetch<NearbyData>(
    gpsPosition ? `/api/nearby?${queryString}` : ""
  );

  if (gpsLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-white/50">
        <Loader2 className="mb-3 h-8 w-8 animate-spin" />
        <p className="text-sm">Finding your location...</p>
      </div>
    );
  }

  if (gpsError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="mb-3 h-8 w-8 text-red-400" />
        <p className="text-sm text-red-400">GPS Error</p>
        <p className="mt-1 text-xs text-white/40">{gpsError}</p>
        <button
          onClick={() => {
            setGpsLoading(true);
            setGpsError(null);
            if ("geolocation" in navigator) {
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  setGpsPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                  setGpsLoading(false);
                },
                (err) => {
                  setGpsError(err.message);
                  setGpsLoading(false);
                }
              );
            }
          }}
          className="mt-3 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-8 w-32 rounded-lg" />
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="mb-3 h-8 w-8 text-red-400" />
        <p className="text-sm text-red-400">Failed to load nearby data</p>
        <p className="mt-1 text-xs text-white/40">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Crosshair className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-white">Nearby</h3>
        </div>
        {onClose && (
          <button onClick={onClose} className="cursor-pointer rounded-lg p-1 text-white/50 hover:bg-white/10 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {gpsPosition && (
          <div className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2">
            <MapPin className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-xs text-white/60">
              {gpsPosition.lat.toFixed(4)}, {gpsPosition.lng.toFixed(4)}
            </span>
          </div>
        )}

        {!data || (!data.spots.length && !data.liveRuns.length && !data.routes.length && !data.events.length && Object.values(data.pois || {}).every((arr) => arr.length === 0)) ? (
          <div className="flex flex-col items-center py-12 text-white/50">
            <MapPin className="mb-3 h-8 w-8" />
            <p className="text-sm">Nothing found nearby</p>
            <p className="mt-1 text-xs text-white/30">Try increasing the search radius</p>
          </div>
        ) : (
          <>
            <NearbySection title="Running Spots" icon={MapPin} items={data.spots} onItemClick={onItemClick} />
            <NearbySection title="Live Runs" icon={Users} items={data.liveRuns} onItemClick={onItemClick} />
            <NearbySection title="Routes" icon={Route} items={data.routes} onItemClick={onItemClick} />
            <NearbySection title="Events" icon={Calendar} items={data.events} onItemClick={onItemClick} />

            {Object.entries(data.pois || {}).map(([category, items]) => {
              if (items.length === 0) return null;
              const Icon = POI_ICONS[category] || MapPin;
              return (
                <NearbySection
                  key={category}
                  title={POI_LABELS[category] || category}
                  icon={Icon}
                  items={items}
                  onItemClick={onItemClick}
                />
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
