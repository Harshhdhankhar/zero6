"use client";

import { useEffect, useCallback } from "react";
import { useFetch } from "@/hooks/use-fetch";

interface Spot {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  spotType: string;
  averageRating: number;
  popularityScore: number;
  city: string;
  description: string;
  coverPhotoUrl: string;
  isVerified: boolean;
}

interface SpotsLayerProps {
  map: any;
  active: boolean;
  onSpotClick?: (spot: Spot) => void;
  bounds?: string;
}

const SOURCE_ID = "spots-source";
const CLUSTER_LAYER_ID = "spots-cluster";
const CLUSTER_COUNT_LAYER_ID = "spots-cluster-count";
const UNCLUSTERED_LAYER_ID = "spots-unclustered";

export function SpotsLayer({ map, active, onSpotClick, bounds }: SpotsLayerProps) {
  const params = new URLSearchParams();
  if (bounds) params.set("bounds", bounds);
  params.set("limit", "50");

  const { data: apiData } = useFetch<{ data: Spot[] }>(
    `/api/spots?${params.toString()}`
  );

  const spots = apiData?.data || [];

  const addSourceAndLayers = useCallback(() => {
    if (!map || spots.length === 0 || !active) return;

    const features = spots
      .filter((s) => s.latitude && s.longitude)
      .map((s) => ({
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates: [s.longitude, s.latitude],
        },
        properties: {
          id: s.id,
          name: s.name,
          spotType: s.spotType,
          rating: s.averageRating,
          popularity: s.popularityScore,
          city: s.city,
          verified: s.isVerified,
        },
      }));

    if (features.length === 0) return;

    const existingSource = map.getSource(SOURCE_ID);
    if (existingSource) {
      existingSource.setData({ type: "FeatureCollection", features });
      return;
    }

    map.addSource(SOURCE_ID, {
      type: "geojson",
      data: { type: "FeatureCollection", features },
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 50,
    });

    map.addLayer({
      id: CLUSTER_LAYER_ID,
      type: "circle",
      source: SOURCE_ID,
      filter: ["has", "point_count"],
      paint: {
        "circle-color": "#FF5A1F",
        "circle-radius": [
          "step", ["get", "point_count"],
          20, 10,
          30, 30,
          50, 40,
        ],
        "circle-opacity": 0.7,
        "circle-stroke-width": 2,
        "circle-stroke-color": "#fff",
      },
    });

    map.addLayer({
      id: CLUSTER_COUNT_LAYER_ID,
      type: "symbol",
      source: SOURCE_ID,
      filter: ["has", "point_count"],
      layout: {
        "text-field": ["get", "point_count_abbreviated"],
        "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
        "text-size": 12,
      },
      paint: {
        "text-color": "#ffffff",
      },
    });

    map.addLayer({
      id: UNCLUSTERED_LAYER_ID,
      type: "circle",
      source: SOURCE_ID,
      filter: ["!", ["has", "point_count"]],
      paint: {
        "circle-color": [
          "case",
          [">=", ["get", "rating"], 4], "#10B981",
          "#FF5A1F",
        ],
        "circle-radius": 6,
        "circle-stroke-width": 2,
        "circle-stroke-color": "#fff",
        "circle-opacity": 0.9,
      },
    });

    map.on("click", UNCLUSTERED_LAYER_ID, (e: any) => {
      if (!e.features?.[0]) return;
      const props = e.features[0].properties;
      const spot = spots.find((s) => s.id === props.id);
      if (spot && onSpotClick) onSpotClick(spot);
    });

    map.on("click", CLUSTER_LAYER_ID, (e: any) => {
      const features = map.queryRenderedFeatures(e.point, { layers: [CLUSTER_LAYER_ID] });
      const clusterId = features[0]?.properties?.cluster_id;
      if (clusterId) {
        map.getSource(SOURCE_ID)?.getClusterExpansionZoom(clusterId, (err: any, zoom: number) => {
          if (err) return;
          map.easeTo({ center: features[0].geometry.coordinates, zoom });
        });
      }
    });

    map.on("mouseenter", UNCLUSTERED_LAYER_ID, () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", UNCLUSTERED_LAYER_ID, () => {
      map.getCanvas().style.cursor = "";
    });
  }, [map, spots, active, onSpotClick]);

  useEffect(() => {
    if (!map) return;
    if (active && spots.length > 0) {
      addSourceAndLayers();
    }
    return () => {
      try {
        if (map.getLayer(UNCLUSTERED_LAYER_ID)) map.removeLayer(UNCLUSTERED_LAYER_ID);
        if (map.getLayer(CLUSTER_COUNT_LAYER_ID)) map.removeLayer(CLUSTER_COUNT_LAYER_ID);
        if (map.getLayer(CLUSTER_LAYER_ID)) map.removeLayer(CLUSTER_LAYER_ID);
        if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
      } catch {}
    };
  }, [active, map, spots, addSourceAndLayers]);

  return null;
}
