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

function groupHotspots(photos: any[], thresholdDeg = 0.01) {
  const groups: any[] = [];
  for (const photo of photos) {
    let added = false;
    for (const group of groups) {
      const dLat = Math.abs(group.lat - photo.latitude);
      const dLng = Math.abs(group.lng - photo.longitude);
      if (dLat < thresholdDeg && dLng < thresholdDeg) {
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
    const coverPhoto = g.photos[0];
    const topRunners = g.photos.slice(0, 3).map((p: any) => ({
      name: p.user_name || "Runner",
      avatar: p.user_avatar || "",
    }));
    return {
      lat: g.lat,
      lng: g.lng,
      count: g.count,
      coverUrl: coverPhoto?.thumbnail_url || coverPhoto?.url || "",
      city: g.city,
      topRunners,
    };
  });
}

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { searchParams } = new URL(request.url);
  const bounds = searchParams.get("bounds");
  const limit = Math.min(100, parseInt(searchParams.get("limit") || "50"));

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const rateCheck = rateLimitMiddleware(user?.id || "anon", "community-photos", 60);
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
    .limit(limit);

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

  const formatted = (photos || []).map((p: any) => ({
    id: p.id,
    userId: p.user_id,
    url: p.url,
    thumbnailUrl: p.thumbnail_url || p.url,
    caption: p.caption,
    latitude: p.latitude,
    longitude: p.longitude,
    city: p.city,
    likes: p.likes || 0,
    createdAt: p.created_at,
    user: p.user
      ? { id: p.user.id, name: p.user.name, username: p.user.username, avatar: p.user.avatar }
      : null,
  }));

  const hotspots = groupHotspots(photos || []);

  return NextResponse.json({
    data: formatted,
    hotspots,
    meta: { total: formatted.length },
  });
}
