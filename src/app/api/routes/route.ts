import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { validateBody } from "@/lib/validations";
import { rateLimitMiddleware } from "@/lib/rate-limit";

const createRouteSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  distance: z.number().positive(),
  elevationGain: z.number().min(0).optional(),
  difficulty: z.enum(["easy", "moderate", "hard", "extreme"]).optional(),
  surfaceType: z.enum(["road", "trail", "track", "park", "mixed", "treadmill"]).optional(),
  routeType: z.enum(["loop", "out-and-back", "point-to-point"]).optional(),
  geometry: z.array(z.object({
    lat: z.number(),
    lng: z.number(),
    elevation: z.number().optional(),
  })).min(2),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  tags: z.array(z.string()).optional(),
});

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { searchParams } = new URL(request.url);

  const city = searchParams.get("city");
  const difficulty = searchParams.get("difficulty");
  const surfaceType = searchParams.get("surfaceType");
  const routeType = searchParams.get("routeType");
  const minDistance = searchParams.get("minDistance");
  const maxDistance = searchParams.get("maxDistance");
  const tag = searchParams.get("tag");
  const sort = searchParams.get("sort") || "recent";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "12")));

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const rateCheck = rateLimitMiddleware(user?.id || "anon", "list-routes", 60);
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let query = supabase
    .from("routes")
    .select(`
      *,
      creator:user_id (id, name, username, avatar),
      statistics:route_statistics (*)
    `, { count: "exact" })
    .eq("is_public", true)
    .neq("status", "archived");

  if (city) query = query.ilike("city", `%${city}%`);
  if (difficulty) query = query.eq("difficulty", difficulty);
  if (surfaceType) query = query.eq("surface_type", surfaceType);
  if (routeType) query = query.eq("route_type", routeType);
  if (minDistance) query = query.gte("distance", parseFloat(minDistance));
  if (maxDistance) query = query.lte("distance", parseFloat(maxDistance));
  if (tag) query = query.contains("tags", [tag]);

  switch (sort) {
    case "popular":
      query = query.order("distance", { ascending: false });
      break;
    case "rating":
      query = query.order("elevation_gain", { ascending: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const { data: routes, count, error } = await query.range(from, to);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

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

  const formatted = (routes || []).map((r: any) => ({
    id: r.id,
    userId: r.user_id,
    title: r.title,
    description: r.description,
    distance: r.distance,
    durationEstimate: r.duration_estimate,
    elevationGain: r.elevation_gain,
    elevationLoss: r.elevation_loss,
    paceEstimate: r.pace_estimate,
    difficulty: r.difficulty,
    surfaceType: r.surface_type,
    routeType: r.route_type,
    geometry: r.geometry,
    city: r.city,
    state: r.state,
    country: r.country,
    tags: r.tags,
    isPublic: r.is_public,
    isFeatured: r.is_featured,
    status: r.status,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    creator: r.creator,
    statistics: r.statistics,
    isBookmarked: bookmarkedIds.includes(r.id),
    isLiked: likedIds.includes(r.id),
  }));

  return NextResponse.json({
    data: formatted,
    meta: { total: count || 0, page, limit },
  });
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateCheck = rateLimitMiddleware(user.id, "create-route", 20);
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await request.json();
  const parsed = validateBody(createRouteSchema, body);
  if (!parsed.success) return parsed.response;

  const elevationGain = parsed.data.elevationGain ?? 0;
  const difficulty = parsed.data.difficulty ?? "moderate";
  const surfaceType = parsed.data.surfaceType ?? "road";
  const routeType = parsed.data.routeType ?? "loop";

  const { data: route, error } = await supabase
    .from("routes")
    .insert({
      user_id: user.id,
      title: parsed.data.title,
      description: parsed.data.description || null,
      distance: parsed.data.distance,
      elevation_gain: elevationGain,
      difficulty,
      surface_type: surfaceType,
      route_type: routeType,
      geometry: parsed.data.geometry,
      city: parsed.data.city || null,
      state: parsed.data.state || null,
      tags: parsed.data.tags || [],
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: { id: route.id } }, { status: 201 });
}
