import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { rateLimitMiddleware } from "@/lib/rate-limit";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ city: string }> }
) {
  const { city } = await params;
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const rateCheck = rateLimitMiddleware(user?.id || "anon", "get-gallery", 60);
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const decodedCity = decodeURIComponent(city);

  const [photosRes, routesRes, spotsRes, clubsRes, eventsRes] = await Promise.all([
    supabase
      .from("activity_photos")
      .select(`
        *,
        user:user_id (id, name, username, avatar)
      `)
      .eq("city", decodedCity)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("routes")
      .select(`
        *,
        statistics:route_statistics (*)
      `)
      .eq("city", decodedCity)
      .eq("is_public", true)
      .neq("status", "archived")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("running_spots")
      .select("*")
      .eq("city", decodedCity)
      .order("popularity_score", { ascending: false })
      .limit(10),
    supabase
      .from("clubs")
      .select("*")
      .ilike("location", `%${decodedCity}%`)
      .limit(10),
    supabase
      .from("events")
      .select("*")
      .ilike("location", `%${decodedCity}%`)
      .in("status", ["upcoming", "ongoing"])
      .order("date", { ascending: true })
      .limit(10),
  ]);

  const photos = (photosRes.data || []).map((p: any) => ({
    id: p.id,
    url: p.url,
    thumbnailUrl: p.thumbnail_url || p.url,
    caption: p.caption,
    latitude: p.latitude,
    longitude: p.longitude,
    likes: p.likes,
    createdAt: p.created_at,
    user: p.user
      ? { id: p.user.id, name: p.user.name, username: p.user.username, avatar: p.user.avatar }
      : null,
  }));

  const routes = (routesRes.data || []).map((r: any) => ({
    id: r.id,
    title: r.title,
    distance: r.distance,
    difficulty: r.difficulty,
    surfaceType: r.surface_type,
    averageRating: r.statistics?.average_rating ?? 0,
    reviewCount: r.statistics?.review_count ?? 0,
  }));

  const spots = (spotsRes.data || []).map((s: any) => ({
    id: s.id,
    name: s.name,
    spotType: s.spot_type,
    averageRating: s.average_rating,
    latitude: s.latitude,
    longitude: s.longitude,
    popularityScore: s.popularity_score,
  }));

  const clubs = (clubsRes.data || []).map((c: any) => ({
    id: c.id,
    name: c.name,
    avatar: c.avatar,
    memberCount: c.member_count,
    category: c.category,
    location: c.location,
  }));

  const events = (eventsRes.data || []).map((e: any) => ({
    id: e.id,
    title: e.title,
    date: e.date,
    type: e.type,
    location: e.location,
    registeredCount: e.registered_count,
    status: e.status,
  }));

  return NextResponse.json({
    data: {
      city: decodedCity,
      topPhotos: photos,
      trendingRoutes: routes,
      popularParks: spots,
      activeClubs: clubs,
      upcomingEvents: events,
    },
    meta: {
      photosCount: photos.length,
      routesCount: routes.length,
      spotsCount: spots.length,
      clubsCount: clubs.length,
      eventsCount: events.length,
    },
  });
}
