import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const querySchema = z.object({
  bounds: z.string().regex(
    /^-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?$/
  ),
  zoom: z.coerce.number().int().min(0).max(20),
  period: z.enum(["day", "week", "month", "year", "all"]).default("all"),
  timeOfDay: z
    .enum(["all", "morning", "afternoon", "evening", "night"])
    .default("all"),
  dayType: z.enum(["all", "weekday", "weekend"]).default("all"),
});

function latLngToTile(
  lat: number,
  lng: number,
  zoom: number
): { x: number; y: number } {
  const n = Math.pow(2, zoom);
  const x = Math.floor(((lng + 180) / 360) * n);
  const y = Math.floor(
    ((1 -
      Math.log(
        Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)
      ) /
        Math.PI) /
      2) *
      n
  );
  return { x, y };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const parsed = querySchema.safeParse({
    bounds: searchParams.get("bounds"),
    zoom: searchParams.get("zoom"),
    period: searchParams.get("period") || "all",
    timeOfDay: searchParams.get("timeOfDay") || "all",
    dayType: searchParams.get("dayType") || "all",
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid parameters", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { bounds, zoom, period, timeOfDay, dayType } = parsed.data;
  const [swLat, swLng, neLat, neLng] = bounds.split(",").map(Number);

  if (
    isNaN(swLat) ||
    isNaN(swLng) ||
    isNaN(neLat) ||
    isNaN(neLng) ||
    swLat < -90 ||
    swLat > 90 ||
    neLat < -90 ||
    neLat > 90 ||
    swLng < -180 ||
    swLng > 180 ||
    neLng < -180 ||
    neLng > 180
  ) {
    return NextResponse.json({ error: "Invalid bounds" }, { status: 400 });
  }

  const minTile = latLngToTile(swLat, swLng, zoom);
  const maxTile = latLngToTile(neLat, neLng, zoom);
  const minX = Math.min(minTile.x, maxTile.x);
  const maxX = Math.max(minTile.x, maxTile.x);
  const minY = Math.min(minTile.y, maxTile.y);
  const maxY = Math.max(minTile.y, maxTile.y);

  const supabase = await createServerSupabaseClient();

  const { data: tiles, error } = await supabase
    .from("heatmap_tiles")
    .select("tile_x, tile_y, intensity, run_count, runner_count")
    .eq("zoom_level", zoom)
    .eq("period", period)
    .eq("time_of_day", timeOfDay)
    .eq("day_type", dayType)
    .gte("tile_x", minX)
    .lte("tile_x", maxX)
    .gte("tile_y", minY)
    .lte("tile_y", maxY)
    .limit(500);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (tiles && tiles.length > 0) {
    return NextResponse.json({
      data: tiles.map((t) => ({
        tileX: t.tile_x,
        tileY: t.tile_y,
        intensity: t.intensity,
        runCount: t.run_count,
        runnerCount: t.runner_count,
      })),
    });
  }

  const { data: waypoints } = await supabase
    .from("heatmap_waypoints")
    .select("latitude, longitude")
    .gte("latitude", Math.min(swLat, neLat))
    .lte("latitude", Math.max(swLat, neLat))
    .gte("longitude", Math.min(swLng, neLng))
    .lte("longitude", Math.max(swLng, neLng))
    .limit(5000);

  if (!waypoints || waypoints.length === 0) {
    return NextResponse.json({ data: [] });
  }

  const tileMap = new Map<string, { count: number }>();
  for (const wp of waypoints) {
    const { x, y } = latLngToTile(wp.latitude, wp.longitude, zoom);
    if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
      const key = `${x}:${y}`;
      const existing = tileMap.get(key);
      if (existing) {
        existing.count++;
      } else {
        tileMap.set(key, { count: 1 });
      }
    }
  }

  const maxCount = Math.max(...Array.from(tileMap.values()).map((t) => t.count), 1);
  const computed = Array.from(tileMap.entries()).map(([key, val]) => {
    const [tileX, tileY] = key.split(":").map(Number);
    return {
      tileX,
      tileY,
      intensity: Math.min(val.count / maxCount, 1),
      runCount: val.count,
      runnerCount: val.count,
    };
  });

  return NextResponse.json({ data: computed });
}
