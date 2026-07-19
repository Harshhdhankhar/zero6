"use client";

import { useEffect, useRef, useCallback } from "react";
import { useFetch } from "@/hooks/use-fetch";

interface MapEvent {
  id: string;
  title: string;
  date: string;
  type: string;
  location: string;
  registered_count: number;
  max_participants: number;
  status: string;
  latitude?: number;
  longitude?: number;
}

interface EventsLayerProps {
  map: any;
  active: boolean;
  onEventClick?: (event: MapEvent) => void;
}

const SOURCE_ID = "events-source";
const LAYER_ID = "events-layer";
const LABEL_ID = "events-label";

export function EventsLayer({ map, active, onEventClick }: EventsLayerProps) {
  const { data: events } = useFetch<MapEvent[]>("/api/events?status=upcoming,ongoing");

  const addSourceAndLayers = useCallback(() => {
    if (!map || !events || !active) return;

    // Only display events with real coordinates - no fake data
    const features = events
      .filter((e) => e.latitude && e.longitude)
      .map((e) => ({
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates: [e.longitude!, e.latitude!],
        },
        properties: {
          id: e.id,
          title: e.title,
          type: e.type,
          date: e.date,
          status: e.status,
          registered: e.registered_count,
          maxParticipants: e.max_participants,
        },
      }));

    if (features.length === 0) return;

    const existing = map.getSource(SOURCE_ID);
    if (existing) {
      existing.setData({ type: "FeatureCollection", features });
      return;
    }

    map.addSource(SOURCE_ID, {
      type: "geojson",
      data: { type: "FeatureCollection", features },
    });

    map.addLayer({
      id: LAYER_ID,
      type: "circle",
      source: SOURCE_ID,
      paint: {
        "circle-color": "#8B5CF6",
        "circle-radius": 8,
        "circle-stroke-width": 2,
        "circle-stroke-color": "#fff",
        "circle-opacity": 0.9,
      },
    });

    map.addLayer({
      id: LABEL_ID,
      type: "symbol",
      source: SOURCE_ID,
      layout: {
        "text-field": ["get", "title"],
        "text-offset": [0, 1.5],
        "text-anchor": "top",
        "text-size": 10,
        "text-max-width": 8,
      },
      paint: {
        "text-color": "#ffffff",
        "text-halo-color": "#000000",
        "text-halo-width": 1,
      },
    });

    map.on("click", LAYER_ID, (e: any) => {
      if (!e.features?.[0]) return;
      const props = e.features[0].properties;
      const event = events.find((ev) => ev.id === props.id);
      if (event && onEventClick) onEventClick(event);
    });

    map.on("mouseenter", LAYER_ID, () => { map.getCanvas().style.cursor = "pointer"; });
    map.on("mouseleave", LAYER_ID, () => { map.getCanvas().style.cursor = ""; });
  }, [map, events, active, onEventClick]);

  useEffect(() => {
    if (!map) return;
    if (active && events && events.length > 0) {
      addSourceAndLayers();
    }
    return () => {
      try {
        if (map.getLayer(LABEL_ID)) map.removeLayer(LABEL_ID);
        if (map.getLayer(LAYER_ID)) map.removeLayer(LAYER_ID);
        if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
      } catch {}
    };
  }, [active, map, events, addSourceAndLayers]);

  return null;
}
