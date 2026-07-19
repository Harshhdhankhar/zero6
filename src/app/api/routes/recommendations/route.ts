import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { rateLimitMiddleware } from "@/lib/rate-limit";

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function haversine(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { searchParams } = new URL(request.url);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateCheck = rateLimitMiddleware(user.id, "route-recommendations", 20);
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const lat = searchParams.get("lat") ? parseFloat(searchParams.get("lat")!) : undefined;
  const lng = searchParams.get("lng") ? parseFloat(searchParams.get("lng")!) : undefined;

  const { data: profile } = await supabase
    .from("profiles")
    .select("total_distance, total_duration, total_runs")
    .eq("id", user.id)
    .single();

  const avgDistance = profile && profile.total_runs > 0
    ? profile.total_distance / profile.total_runs
    : 5000;

  const userDistanceKm = avgDistance / 1000;
  const minDist = Math.max(1, userDistanceKm - 3);
  const maxDist = userDistanceKm + 3;

  const { data: allRoutes, error } = await supabase
    .from("routes")
    .select(`
      *,
      creator:user_id (id, name, username, avatar),
      statistics:route_statistics (*)
    `)
    .eq("is_public", true)
    .neq("status", "archived")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const routes = allRoutes || [];

  const personalized = routes
    .filter((r: any) => {
      const distKm = (r.distance || 0) / 1000;
      return distKm >= minDist && distKm <= maxDist;
    })
    .slice(0, 6);

  let nearby: any[] = [];
  if (lat && lng) {
    nearby = routes
      .map((r: any) => {
        const geo = r.geometry || [];
        if (geo.length === 0) return null;
        const first = geo[0];
        const dist = haversine(lat, lng, first.lat, first.lng);
        return { ...r, _distance: dist };
      })
      .filter((r: any) => r && r._distance <= 10)
      .sort((a: any, b: any) => a._distance - b._distance)
      .slice(0, 6);
  }

  const popular = routes
    .sort((a: any, b: any) => {
      const aScore = (a.statistics?.like_count || 0) + (a.statistics?.bookmark_count || 0);
      const bScore = (b.statistics?.like_count || 0) + (b.statistics?.bookmark_count || 0);
      return bScore - aScore;
    })
    .slice(0, 6);

  const formatRoute = (r: any) => ({
    id: r.id,
    userId: r.user_id,
    title: r.title,
    description: r.description,
    distance: r.distance,
    elevationGain: r.elevation_gain,
    difficulty: r.difficulty,
    surfaceType: r.surface_type,
    routeType: r.route_type,
    geometry: r.geometry,
    city: r.city,
    state: r.state,
    tags: r.tags,
    isPublic: r.is_public,
    createdAt: r.created_at,
    creator: r.creator,
    statistics: r.statistics,
  });

  return NextResponse.json({
    data: {
      personalized: personalized.map(formatRoute),
      nearby: nearby.map(formatRoute),
      popular: popular.map(formatRoute),
    },
  });
}
