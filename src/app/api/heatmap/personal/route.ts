import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { rateLimitMiddleware } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateCheck = rateLimitMiddleware(user.id, "personalHeatmap", 30, 60000);
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = Math.min(
    parseInt(searchParams.get("limit") || "5000", 10),
    5000
  );
  const offset = (page - 1) * limit;

  const { data: waypoints, error: wpError } = await supabase
    .from("heatmap_waypoints")
    .select("id, latitude, longitude, altitude, speed, recorded_at")
    .eq("user_id", user.id)
    .order("recorded_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (wpError) {
    return NextResponse.json({ error: wpError.message }, { status: 500 });
  }

  const { data: personalSummary } = await supabase
    .from("personal_heatmap")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const { count: totalCount } = await supabase
    .from("heatmap_waypoints")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  return NextResponse.json({
    data: {
      waypoints: (waypoints || []).map((w) => ({
        id: w.id,
        latitude: w.latitude,
        longitude: w.longitude,
        altitude: w.altitude,
        speed: w.speed,
        recordedAt: w.recorded_at,
      })),
      summary: {
        totalUniqueLocations: personalSummary?.total_unique_locations || 0,
        mostVisitedLocation: personalSummary?.most_visited_location || null,
        longestRouteId: personalSummary?.longest_route_id || null,
        favoriteRouteId: personalSummary?.favorite_route_id || null,
        totalDistanceCovered: personalSummary?.total_distance_covered || 0,
      },
      meta: {
        total: totalCount ?? 0,
        page,
        limit,
      },
    },
  });
}
