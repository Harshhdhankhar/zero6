"use client";

import { useEffect, useRef, useCallback } from "react";
import { useFetch } from "@/hooks/use-fetch";

interface RouteGeometry {
  id: string;
  title: string;
  distance: number;
  elevation_gain: number;
  difficulty: string;
  surface_type: string;
  geometry: { lat: number; lng: number }[];
  city: string;
  average_rating?: number;
  user_name?: string;
}

interface RoutesLayerProps {
  map: any;
  active: boolean;
  onRouteClick?: (route: RouteGeometry) => void;
  bounds?: string;
}

const SOURCE_ID = "routes-source";
const LINE_LAYER_ID = "routes-line";
const HIGHLIGHT_LAYER_ID = "routes-highlight";

export function RoutesLayer({ map, active, onRouteClick, bounds }: RoutesLayerProps) {
  const params = new URLSearchParams();
  if (bounds) params.set("bounds", bounds);
  params.set("limit", "100");

  const { data: routes } = useFetch<RouteGeometry[]>(
    `/api/routes?${params.toString()}`
  );

  const cleanupRef = useRef<(() => void) | null>(null);

  const addSourceAndLayers = useCallback(() => {
    if (!map || !routes || !active) return;

    const features = routes
      .filter((r) => r.geometry && r.geometry.length > 1)
      .map((r) => ({
        type: "Feature" as const,
        geometry: {
          type: "LineString" as const,
          coordinates: r.geometry.map((pt) => [pt.lng, pt.lat]),
        },
        properties: {
          id: r.id,
          title: r.title,
          distance: r.distance,
          elevation: r.elevation_gain,
          difficulty: r.difficulty,
          surface: r.surface_type,
          rating: r.average_rating || 0,
        },
      }));

    if (features.length === 0) return;

    const source = map.getSource(SOURCE_ID);
    if (source) {
      source.setData({ type: "FeatureCollection", features });
      return;
    }

    map.addSource(SOURCE_ID, {
      type: "geojson",
      data: { type: "FeatureCollection", features },
    });

    map.addLayer({
      id: LINE_LAYER_ID,
      type: "line",
      source: SOURCE_ID,
      paint: {
        "line-color": "#FF5A1F",
        "line-width": [
          "interpolate", ["linear"], ["zoom"],
          10, 1.5,
          15, 4,
        ],
        "line-opacity": 0.7,
      },
    });

    map.addLayer({
      id: HIGHLIGHT_LAYER_ID,
      type: "line",
      source: SOURCE_ID,
      paint: {
        "line-color": "#FF5A1F",
        "line-width": [
          "interpolate", ["linear"], ["zoom"],
          10, 4,
          15, 8,
        ],
        "line-opacity": 0,
      },
      filter: ["==", ["get", "id"], ""],
    });

    map.on("click", LINE_LAYER_ID, (e: any) => {
      if (!e.features?.[0]) return;
      const props = e.features[0].properties;
      const route = routes.find((r) => r.id === props.id);
      if (route && onRouteClick) onRouteClick(route);
    });

    map.on("mouseenter", LINE_LAYER_ID, () => {
      map.getCanvas().style.cursor = "pointer";
    });

    map.on("mouseleave", LINE_LAYER_ID, () => {
      map.getCanvas().style.cursor = "";
    });

    cleanupRef.current = () => {
      try {
        if (map.getLayer(HIGHLIGHT_LAYER_ID)) map.removeLayer(HIGHLIGHT_LAYER_ID);
        if (map.getLayer(LINE_LAYER_ID)) map.removeLayer(LINE_LAYER_ID);
        if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
      } catch {}
    };
  }, [map, routes, active, onRouteClick]);

  useEffect(() => {
    if (!map) return;
    addSourceAndLayers();

    return () => {
      cleanupRef.current?.();
    };
  }, [map, addSourceAndLayers]);

  useEffect(() => {
    if (!map || !routes) return;
    if (active) {
      addSourceAndLayers();
    } else {
      cleanupRef.current?.();
      cleanupRef.current = null;
    }
  }, [active, map, routes, addSourceAndLayers]);

  return null;
}
