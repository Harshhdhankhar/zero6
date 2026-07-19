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

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get("lat") || "0");
  const lng = parseFloat(searchParams.get("lng") || "0");
  const radius = parseFloat(searchParams.get("radius") || "5");

  if (!lat || !lng) {
    return NextResponse.json({ error: "lat and lng required" }, { status: 400 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const rateCheck = rateLimitMiddleware(user?.id || "anon", "nearby", 60);
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const [spotsRes, poisRes, liveRunsRes, eventsRes, routesRes] = await Promise.all([
    supabase.from("running_spots").select("*").limit(50),
    supabase.from("nearby_pois").select("*").limit(50),
    supabase.from("live_runs").select(`
      *,
      profile:user_id (id, name, username, avatar)
    `).eq("status", "active").limit(50),
    supabase.from("events").select("*").in("status", ["upcoming", "ongoing"]).limit(50),
    supabase.from("routes").select(`
      *,
      statistics:route_statistics (*)
    `).eq("is_public", true).neq("status", "archived").limit(50),
  ]);

  const spots = (spotsRes.data || [])
    .filter((s: any) => haversine(lat, lng, s.latitude, s.longitude) <= radius)
    .slice(0, 10)
    .map((s: any) => ({
      id: s.id,
      name: s.name,
      latitude: s.latitude,
      longitude: s.longitude,
      distance: Math.round(haversine(lat, lng, s.latitude, s.longitude) * 100) / 100,
      spotType: s.spot_type,
      averageRating: s.average_rating,
      city: s.city,
    }));

  const poiCategories = ["cafe", "metro", "hospital", "pharmacy", "running_store", "sports_shop", "water_station", "public_toilet", "medical_facility", "police_station"];
  const pois: Record<string, any[]> = {};
  for (const cat of poiCategories) {
    pois[cat] = [];
  }

  for (const p of (poisRes.data || [])) {
    const dist = haversine(lat, lng, p.latitude, p.longitude);
    if (dist <= radius) {
      const category = p.category;
      if (!pois[category]) pois[category] = [];
      if (pois[category].length < 10) {
        pois[category].push({
          id: p.id,
          name: p.name,
          latitude: p.latitude,
          longitude: p.longitude,
          distance: Math.round(dist * 100) / 100,
          category: p.category,
          phone: p.phone,
          address: p.address,
        });
      }
    }
  }

  const liveRuns = (liveRunsRes.data || [])
    .filter((r: any) => {
      if (!r.current_latitude || !r.current_longitude) return false;
      return haversine(lat, lng, r.current_latitude, r.current_longitude) <= radius;
    })
    .slice(0, 10)
    .map((r: any) => ({
      id: r.id,
      userId: r.user_id,
      userName: r.profile?.name || "Runner",
      userAvatar: r.profile?.avatar || "",
      latitude: r.current_latitude,
      longitude: r.current_longitude,
      distance: Math.round(haversine(lat, lng, r.current_latitude, r.current_longitude) * 100) / 100,
      pace: r.average_pace,
      duration: r.duration,
    }));

  const events = (eventsRes.data || [])
    .filter((e: any) => {
      if (!e.location) return false;
      return true;
    })
    .slice(0, 10)
    .map((e: any) => ({
      id: e.id,
      title: e.title,
      date: e.date,
      type: e.type,
      location: e.location,
      registeredCount: e.registered_count,
      status: e.status,
    }));

  const routes = (routesRes.data || [])
    .filter((r: any) => {
      const geom = r.geometry;
      if (!geom || !geom.length) return false;
      const mid = geom[Math.floor(geom.length / 2)];
      return haversine(lat, lng, mid.lat, mid.lng) <= radius;
    })
    .slice(0, 10)
    .map((r: any) => ({
      id: r.id,
      title: r.title,
      distance: r.distance,
      difficulty: r.difficulty,
      surfaceType: r.surface_type,
      averageRating: r.statistics?.average_rating ?? 0,
      city: r.city,
    }));

  return NextResponse.json({
    data: {
      spots,
      pois,
      liveRuns,
      events,
      routes,
    },
    meta: { lat, lng, radius },
  });
}
