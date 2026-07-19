import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { rateLimitMiddleware } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { searchParams } = new URL(request.url);

  const lat = parseFloat(searchParams.get("lat") || "20.5937");
  const lng = parseFloat(searchParams.get("lng") || "78.9629");
  const radius = parseFloat(searchParams.get("radius") || "10"); // km

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userId = user?.id || "anonymous";
  const rateCheck = rateLimitMiddleware(userId, "mapDiscovery", 30, 60000);
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    // Calculate bounding box for nearby search
    const latDelta = radius / 111; // ~111km per degree latitude
    const lngDelta = radius / (111 * Math.cos((lat * Math.PI) / 180));
    const minLat = lat - latDelta;
    const maxLat = lat + latDelta;
    const minLng = lng - lngDelta;
    const maxLng = lng + lngDelta;

    // Fetch all nearby data in parallel
    const [
      clubsResult,
      liveRunsResult,
      eventsResult,
      routesResult,
      photosResult,
      spotsResult,
    ] = await Promise.allSettled([
      // Nearby clubs
      supabase
        .from("clubs")
        .select("id, member_count, activity_count")
        .gte("member_count", 5)
        .limit(100),

      // Live runs
      supabase
        .from("live_runs")
        .select("id")
        .eq("status", "active")
        .limit(100),

      // Events this week
      supabase
        .from("events")
        .select("id")
        .in("status", ["upcoming", "ongoing"])
        .gte("date", new Date().toISOString())
        .lte("date", new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())
        .limit(100),

      // Popular routes nearby
      supabase
        .from("routes")
        .select("id")
        .eq("is_public", true)
        .neq("status", "archived")
        .limit(100),

      // Community photos nearby
      supabase
        .from("activity_photos")
        .select("id")
        .gte("latitude", minLat)
        .lte("latitude", maxLat)
        .gte("longitude", minLng)
        .lte("longitude", maxLng)
        .limit(100),

      // Running spots nearby
      supabase
        .from("running_spots")
        .select("id")
        .gte("latitude", minLat)
        .lte("latitude", maxLat)
        .gte("longitude", minLng)
        .lte("longitude", maxLng)
        .limit(100),
    ]);

    const communities = clubsResult.status === "fulfilled" ? clubsResult.value.data?.length || 0 : 0;
    const liveRunners = liveRunsResult.status === "fulfilled" ? liveRunsResult.value.data?.length || 0 : 0;
    const eventsThisWeek = eventsResult.status === "fulfilled" ? eventsResult.value.data?.length || 0 : 0;
    const popularRoutes = routesResult.status === "fulfilled" ? routesResult.value.data?.length || 0 : 0;
    const communityPhotos = photosResult.status === "fulfilled" ? photosResult.value.data?.length || 0 : 0;
    const runningSpots = spotsResult.status === "fulfilled" ? spotsResult.value.data?.length || 0 : 0;

    return NextResponse.json({
      communities,
      liveRunners,
      eventsThisWeek,
      popularRoutes,
      communityPhotos,
      runningSpots,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        communities: 0,
        liveRunners: 0,
        eventsThisWeek: 0,
        popularRoutes: 0,
        communityPhotos: 0,
        runningSpots: 0,
      },
      { status: 200 }
    );
  }
}
