import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { rateLimitMiddleware } from "@/lib/rate-limit";

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const rateCheck = rateLimitMiddleware(user?.id || "anon", "get-spot", 60);
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { data: spot, error } = await supabase
    .from("running_spots")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !spot) {
    return NextResponse.json({ error: "Spot not found" }, { status: 404 });
  }

  const [facilitiesRes, reviewsRes, avgRatingRes] = await Promise.all([
    supabase.from("spot_facilities").select("*").eq("spot_id", id),
    supabase.from("spot_reviews").select(`
      *,
      user:user_id (id, name, username, avatar)
    `).eq("spot_id", id).order("created_at", { ascending: false }).limit(10),
    supabase.from("spot_reviews").select("rating").eq("spot_id", id),
  ]);

  const avgRating = avgRatingRes.data && avgRatingRes.data.length > 0
    ? avgRatingRes.data.reduce((sum: number, r: any) => sum + r.rating, 0) / avgRatingRes.data.length
    : spot.average_rating;

  let nearbyRoutes: any[] = [];
  if (spot.city) {
    const { data: routes } = await supabase
      .from("routes")
      .select(`
        *,
        statistics:route_statistics (*)
      `)
      .eq("is_public", true)
      .eq("city", spot.city)
      .neq("status", "archived")
      .limit(10);

    if (routes) {
      nearbyRoutes = routes
        .filter((r: any) => {
          const geom = r.geometry;
          if (!geom || !geom.length) return false;
          const mid = geom[Math.floor(geom.length / 2)];
          return haversine(spot.latitude, spot.longitude, mid.lat, mid.lng) <= 2;
        })
        .slice(0, 5)
        .map((r: any) => ({
          id: r.id,
          title: r.title,
          distance: r.distance,
          difficulty: r.difficulty,
          surfaceType: r.surface_type,
          averageRating: r.statistics?.average_rating ?? 0,
        }));
    }
  }

  let nearbyPois: any[] = [];
  const { data: pois } = await supabase
    .from("nearby_pois")
    .select("*")
    .limit(50);

  if (pois) {
    nearbyPois = pois
      .filter((p: any) => haversine(spot.latitude, spot.longitude, p.latitude, p.longitude) <= 1)
      .slice(0, 5)
      .map((p: any) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        latitude: p.latitude,
        longitude: p.longitude,
        distance: Math.round(haversine(spot.latitude, spot.longitude, p.latitude, p.longitude) * 100) / 100,
        phone: p.phone,
      }));
  }

  const formatted = {
    id: spot.id,
    name: spot.name,
    description: spot.description,
    coverPhotoUrl: spot.cover_photo_url,
    latitude: spot.latitude,
    longitude: spot.longitude,
    city: spot.city,
    state: spot.state,
    spotType: spot.spot_type,
    popularityScore: spot.popularity_score,
    averageRating: Math.round(avgRating * 10) / 10,
    totalRuns: spot.total_runs,
    totalRunners: spot.total_runners,
    bestTimeToRun: spot.best_time_to_run,
    averagePace: spot.average_pace,
    elevationGain: spot.elevation_gain,
    distanceRange: spot.distance_range,
    surfaceType: spot.surface_type,
    safetyRating: spot.safety_rating,
    isVerified: spot.is_verified,
    tags: spot.tags,
    facilities: (facilitiesRes.data || []).map((f: any) => ({
      id: f.id,
      facilityType: f.facility_type,
      description: f.description,
      isFree: f.is_free,
      openingHours: f.opening_hours,
    })),
    reviews: (reviewsRes.data || []).map((r: any) => ({
      id: r.id,
      userId: r.user_id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.created_at,
      user: r.user
        ? { id: r.user.id, name: r.user.name, username: r.user.username, avatar: r.user.avatar }
        : null,
    })),
    reviewCount: reviewsRes.data?.length || 0,
    nearbyRoutes,
    nearbyPois,
  };

  return NextResponse.json({ data: formatted });
}
