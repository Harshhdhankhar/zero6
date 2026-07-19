import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { rateLimitMiddleware } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city");
  const type = searchParams.get("type");
  const search = searchParams.get("search");
  const sort = searchParams.get("sort") || "popularity";
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
  const offset = Math.max(0, parseInt(searchParams.get("offset") || "0"));
  const bounds = searchParams.get("bounds");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const rateCheck = rateLimitMiddleware(user?.id || "anon", "list-spots", 60);
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let query = supabase
    .from("running_spots")
    .select(`
      *,
      facilities:spot_facilities(count),
      reviews:spot_reviews(count),
      routes:running_area_routes(count),
      communities:running_area_communities(count),
      events:running_area_events(count)
    `, { count: "exact" });

  if (city) query = query.ilike("city", `%${city}%`);
  if (type) query = query.eq("spot_type", type);
  if (search) query = query.ilike("name", `%${search}%`);

  switch (sort) {
    case "rating":
      query = query.order("average_rating", { ascending: false });
      break;
    case "safety":
      query = query.order("safety_score", { ascending: false });
      break;
    case "popularity":
    default:
      query = query.order("popularity_score", { ascending: false });
  }

  const { data: spots, count, error } = await query.range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const formatted = (spots || []).map((s: any) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    coverPhotoUrl: s.cover_photo_url,
    latitude: s.latitude,
    longitude: s.longitude,
    city: s.city,
    state: s.state,
    spotType: s.spot_type,
    popularityScore: s.popularity_score,
    averageRating: s.average_rating,
    safety_score: s.safety_score,
    totalRuns: s.total_runs,
    totalRunners: s.total_runners,
    average_daily_runners: s.average_daily_runners,
    facilityCount: s.facilities?.length ?? s.facilities?.[0]?.count ?? 0,
    reviewCount: s.reviews?.length ?? s.reviews?.[0]?.count ?? 0,
    popular_routes_count: s.routes?.length ?? s.routes?.[0]?.count ?? 0,
    nearby_communities_count: s.communities?.length ?? s.communities?.[0]?.count ?? 0,
    nearby_events_count: s.events?.length ?? s.events?.[0]?.count ?? 0,
    isVerified: s.is_verified,
    isFeatured: s.is_featured,
    live_runners: s.live_runners,
    today_visits: s.today_visits,
    best_time_to_run: s.best_time_to_run,
    surface_type: s.surface_type,
    difficulty: s.difficulty,
    terrain: s.terrain,
    loop_distance: s.loop_distance,
    estimated_time: s.estimated_time,
    open_hours: s.open_hours,
    entry_fee: s.entry_fee,
    ai_recommendation: s.ai_recommendation,
    women_safety_rating: s.women_safety_rating,
    crowd_level: s.crowd_level,
    water: s.facilities?.some((f: any) => f.facility_type === 'water_point' || f.facility_type === 'drinking_fountain'),
    washroom: s.facilities?.some((f: any) => f.facility_type === 'washroom'),
    parking: s.facilities?.some((f: any) => f.facility_type === 'parking'),
    lighting: s.facilities?.some((f: any) => f.facility_type === 'lighting'),
    tags: s.tags,
  }));

  return NextResponse.json({
    data: formatted,
    meta: { total: count || 0, limit, offset },
  });
}
