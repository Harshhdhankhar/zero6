import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { rateLimitMiddleware } from "@/lib/rate-limit";

const DEFAULT_LAYERS = {
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

export async function GET() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(DEFAULT_LAYERS);
  }

  const rateCheck = rateLimitMiddleware(user.id, "mapLayersGet", 20, 60000);
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { data } = await supabase
    .from("user_map_layers")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!data) {
    return NextResponse.json(DEFAULT_LAYERS);
  }

  const layers = data.layers as Record<string, boolean> | null;

  return NextResponse.json({
    heatmap: layers?.heatmap ?? DEFAULT_LAYERS.heatmap,
    communityPhotos: layers?.community_photos ?? DEFAULT_LAYERS.communityPhotos,
    routes: layers?.routes ?? DEFAULT_LAYERS.routes,
    events: layers?.events ?? DEFAULT_LAYERS.events,
    clubs: layers?.clubs ?? DEFAULT_LAYERS.clubs,
    challenges: layers?.challenges ?? DEFAULT_LAYERS.challenges,
    runningSpots: layers?.running_spots ?? DEFAULT_LAYERS.runningSpots,
    liveRuns: layers?.live_runs ?? DEFAULT_LAYERS.liveRuns,
    waterPoints: layers?.water_points ?? DEFAULT_LAYERS.waterPoints,
    medical: layers?.medical ?? DEFAULT_LAYERS.medical,
    weather: layers?.weather ?? DEFAULT_LAYERS.weather,
    aqi: layers?.aqi ?? DEFAULT_LAYERS.aqi,
    traffic: layers?.traffic ?? DEFAULT_LAYERS.traffic,
  });
}

export async function PATCH(request: Request) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateCheck = rateLimitMiddleware(user.id, "mapLayersPatch", 20, 60000);
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await request.json();

  const { data: existing } = await supabase
    .from("user_map_layers")
    .select("layers")
    .eq("user_id", user.id)
    .single();

  const currentLayers = (existing?.layers as Record<string, boolean>) || {};

  const merged = {
    ...currentLayers,
    heatmap: body.heatmap ?? currentLayers.heatmap ?? DEFAULT_LAYERS.heatmap,
    community_photos: body.communityPhotos ?? currentLayers.community_photos ?? DEFAULT_LAYERS.communityPhotos,
    routes: body.routes ?? currentLayers.routes ?? DEFAULT_LAYERS.routes,
    events: body.events ?? currentLayers.events ?? DEFAULT_LAYERS.events,
    clubs: body.clubs ?? currentLayers.clubs ?? DEFAULT_LAYERS.clubs,
    challenges: body.challenges ?? currentLayers.challenges ?? DEFAULT_LAYERS.challenges,
    running_spots: body.runningSpots ?? currentLayers.running_spots ?? DEFAULT_LAYERS.runningSpots,
    live_runs: body.liveRuns ?? currentLayers.live_runs ?? DEFAULT_LAYERS.liveRuns,
    water_points: body.waterPoints ?? currentLayers.water_points ?? DEFAULT_LAYERS.waterPoints,
    medical: body.medical ?? currentLayers.medical ?? DEFAULT_LAYERS.medical,
    weather: body.weather ?? currentLayers.weather ?? DEFAULT_LAYERS.weather,
    aqi: body.aqi ?? currentLayers.aqi ?? DEFAULT_LAYERS.aqi,
    traffic: body.traffic ?? currentLayers.traffic ?? DEFAULT_LAYERS.traffic,
  };

  const { error } = await supabase.from("user_map_layers").upsert(
    {
      user_id: user.id,
      layers: merged,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
