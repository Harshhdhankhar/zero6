"use client";

import { useEffect, useRef, useCallback } from "react";
import { useFetch } from "@/hooks/use-fetch";

interface MapClub {
  id: string;
  name: string;
  avatar: string;
  location: string;
  city: string;
  category: string;
  member_count: number;
  activity_count?: number;
  latitude?: number;
  longitude?: number;
}

interface ClubsLayerProps {
  map: any;
  active: boolean;
  onClubClick?: (club: MapClub) => void;
}

const SOURCE_ID = "clubs-source";
const LAYER_ID = "clubs-layer";
const LABEL_ID = "clubs-label";

export function ClubsLayer({ map, active, onClubClick }: ClubsLayerProps) {
  const { data: clubs } = useFetch<MapClub[]>(
    `/api/clubs${active ? "" : `?_ts=${Date.now()}`}`
  );

  const addSourceAndLayers = useCallback(() => {
    if (!map || !clubs || !active) return;

    // Only display clubs with real coordinates - no fake data
    const features = clubs
      .filter((c) => c.latitude && c.longitude)
      .map((c) => ({
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates: [c.longitude!, c.latitude!],
        },
        properties: {
          id: c.id,
          name: c.name,
          category: c.category,
          members: c.member_count,
          city: c.city,
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
        "circle-color": "#06B6D4",
        "circle-radius": 7,
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
        "text-field": ["get", "name"],
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
      const club = clubs.find((c) => c.id === props.id);
      if (club && onClubClick) onClubClick(club);
    });

    map.on("mouseenter", LAYER_ID, () => { map.getCanvas().style.cursor = "pointer"; });
    map.on("mouseleave", LAYER_ID, () => { map.getCanvas().style.cursor = ""; });
  }, [map, clubs, active, onClubClick]);

  useEffect(() => {
    if (!map) return;
    if (active && clubs && clubs.length > 0) {
      addSourceAndLayers();
    }
    return () => {
      try {
        if (map.getLayer(LABEL_ID)) map.removeLayer(LABEL_ID);
        if (map.getLayer(LAYER_ID)) map.removeLayer(LAYER_ID);
        if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
      } catch {}
    };
  }, [active, map, clubs, addSourceAndLayers]);

  return null;
}
