import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { rateLimitMiddleware } from "@/lib/rate-limit";

function groupHotspots(photos: any[], zoom: number) {
  const threshold = Math.max(0.005, 0.05 - (zoom - 10) * 0.008);
  const groups: any[] = [];
  for (const photo of photos) {
    let added = false;
    for (const group of groups) {
      const dLat = Math.abs(group.lat - photo.latitude);
      const dLng = Math.abs(group.lng - photo.longitude);
      if (dLat < threshold && dLng < threshold) {
        group.count++;
        if (group.photos.length < 5) group.photos.push(photo);
        added = true;
        break;
      }
    }
    if (!added) {
      groups.push({
        lat: photo.latitude,
        lng: photo.longitude,
        count: 1,
        photos: [photo],
        city: photo.city,
      });
    }
  }
  return groups.map((g) => {
    const cover = g.photos[0];
    return {
      lat: g.lat,
      lng: g.lng,
      count: g.count,
      coverUrl: cover?.thumbnail_url || cover?.url || "",
      city: g.city,
      topRunners: g.photos.slice(0, 3).map((p: any) => ({
        name: p.user?.name || p.user_name || "Runner",
        avatar: p.user?.avatar || p.user_avatar || "",
      })),
    };
  });
}

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { searchParams } = new URL(request.url);
  const bounds = searchParams.get("bounds");
  const zoom = Math.min(20, Math.max(0, parseInt(searchParams.get("zoom") || "10")));

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const rateCheck = rateLimitMiddleware(user?.id || "anon", "community-photos-hotspots", 60);
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let query = supabase
    .from("activity_photos")
    .select(`
      *,
      user:user_id (id, name, username, avatar)
    `)
    .order("created_at", { ascending: false })
    .limit(200);

  if (bounds) {
    const parts = bounds.split(",").map(Number);
    if (parts.length === 4) {
      const [swLat, swLng, neLat, neLng] = parts;
      query = query
        .gte("latitude", swLat)
        .lte("latitude", neLat)
        .gte("longitude", swLng)
        .lte("longitude", neLng);
    }
  }

  const { data: photos, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const hotspots = groupHotspots(photos || [], zoom);

  return NextResponse.json({
    data: hotspots,
    meta: { total: hotspots.length },
  });
}
