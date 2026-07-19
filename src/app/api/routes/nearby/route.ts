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

  const lat = parseFloat(searchParams.get("lat") || "0");
  const lng = parseFloat(searchParams.get("lng") || "0");
  const radius = parseFloat(searchParams.get("radius") || "10");
  const limit = Math.min(50, parseInt(searchParams.get("limit") || "20"));

  if (!lat || !lng) {
    return NextResponse.json({ error: "lat and lng are required" }, { status: 400 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const rateCheck = rateLimitMiddleware(user?.id || "anon", "nearby-routes", 60);
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { data: routes, error } = await supabase
    .from("routes")
    .select(`
      *,
      creator:user_id (id, name, username, avatar),
      statistics:route_statistics (*)
    `)
    .eq("is_public", true)
    .neq("status", "archived")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const nearby = (routes || [])
    .map((r: any) => {
      const geo = r.geometry || [];
      if (geo.length === 0) return null;
      const first = geo[0];
      const dist = haversine(lat, lng, first.lat, first.lng);
      return { ...r, _distance: dist };
    })
    .filter((r: any) => r && r._distance <= radius)
    .sort((a: any, b: any) => a._distance - b._distance)
    .slice(0, limit);

  let bookmarkedIds: string[] = [];
  let likedIds: string[] = [];
  if (user) {
    const [bmRes, lkRes] = await Promise.all([
      supabase.from("route_bookmarks").select("route_id").eq("user_id", user.id),
      supabase.from("route_likes").select("route_id").eq("user_id", user.id),
    ]);
    bookmarkedIds = (bmRes.data || []).map((b: any) => b.route_id);
    likedIds = (lkRes.data || []).map((l: any) => l.route_id);
  }

  const formatted = nearby.map((r: any) => ({
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
    distanceFromUser: Math.round(r._distance * 10) / 10,
    isBookmarked: bookmarkedIds.includes(r.id),
    isLiked: likedIds.includes(r.id),
  }));

  return NextResponse.json({ data: formatted });
}
