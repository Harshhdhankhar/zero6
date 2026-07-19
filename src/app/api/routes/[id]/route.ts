import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { rateLimitMiddleware } from "@/lib/rate-limit";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const rateCheck = rateLimitMiddleware(user?.id || "anon", "get-route", 60);
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { data: route, error } = await supabase
    .from("routes")
    .select(`
      *,
      creator:user_id (id, name, username, avatar),
      statistics:route_statistics (*)
    `)
    .eq("id", id)
    .single();

  if (error || !route) {
    return NextResponse.json({ error: "Route not found" }, { status: 404 });
  }

  const [photosRes, reviewsRes, bmRes, lkRes] = await Promise.all([
    supabase.from("route_photos").select("*").eq("route_id", id).order("created_at", { ascending: false }),
    supabase.from("route_reviews").select(`
      *,
      user:user_id (id, name, username, avatar)
    `).eq("route_id", id).order("created_at", { ascending: false }),
    user ? supabase.from("route_bookmarks").select("id").eq("route_id", id).eq("user_id", user.id).maybeSingle() : Promise.resolve({ data: null }),
    user ? supabase.from("route_likes").select("id").eq("route_id", id).eq("user_id", user.id).maybeSingle() : Promise.resolve({ data: null }),
  ]);

  const formatted = {
    id: route.id,
    userId: route.user_id,
    title: route.title,
    description: route.description,
    distance: route.distance,
    durationEstimate: route.duration_estimate,
    elevationGain: route.elevation_gain,
    elevationLoss: route.elevation_loss,
    paceEstimate: route.pace_estimate,
    difficulty: route.difficulty,
    surfaceType: route.surface_type,
    routeType: route.route_type,
    geometry: route.geometry,
    city: route.city,
    state: route.state,
    country: route.country,
    tags: route.tags,
    isPublic: route.is_public,
    isFeatured: route.is_featured,
    status: route.status,
    createdAt: route.created_at,
    updatedAt: route.updated_at,
    creator: route.creator,
    statistics: route.statistics,
    photos: (photosRes.data || []).map((p: any) => ({
      id: p.id,
      routeId: p.route_id,
      userId: p.user_id,
      url: p.url,
      thumbnailUrl: p.thumbnail_url,
      caption: p.caption,
      latitude: p.latitude,
      longitude: p.longitude,
      isCover: p.is_cover,
      createdAt: p.created_at,
    })),
    reviews: (reviewsRes.data || []).map((r: any) => ({
      id: r.id,
      routeId: r.route_id,
      userId: r.user_id,
      rating: r.rating,
      difficultyRating: r.difficulty_rating,
      safetyRating: r.safety_rating,
      cleanlinessRating: r.cleanliness_rating,
      crowdRating: r.crowd_rating,
      lightingRating: r.lighting_rating,
      waterAvailability: r.water_availability,
      comment: r.comment,
      wouldRecommend: r.would_recommend,
      createdAt: r.created_at,
      user: r.user,
    })),
    isBookmarked: !!bmRes.data,
    isLiked: !!lkRes.data,
  };

  return NextResponse.json({ data: formatted });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateCheck = rateLimitMiddleware(user.id, "update-route", 20);
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { data: existing } = await supabase
    .from("routes")
    .select("user_id")
    .eq("id", id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (existing.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const allowedFields = [
    "title", "description", "distance", "elevation_gain",
    "difficulty", "surface_type", "route_type", "geometry",
    "city", "state", "tags", "is_public", "status",
  ];
  const updateData: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updateData[field] = body[field];
    }
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { error } = await supabase
    .from("routes")
    .update(updateData)
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: { id } });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateCheck = rateLimitMiddleware(user.id, "delete-route", 10);
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { data: existing } = await supabase
    .from("routes")
    .select("user_id")
    .eq("id", id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (existing.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabase.from("routes").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: { id } });
}
