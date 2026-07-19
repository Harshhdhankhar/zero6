import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { validateBody } from "@/lib/validations";
import { rateLimitMiddleware } from "@/lib/rate-limit";

const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  difficultyRating: z.number().int().min(1).max(5).optional(),
  safetyRating: z.number().int().min(1).max(5).optional(),
  cleanlinessRating: z.number().int().min(1).max(5).optional(),
  crowdRating: z.number().int().min(1).max(5).optional(),
  lightingRating: z.number().int().min(1).max(5).optional(),
  waterAvailability: z.number().int().min(1).max(5).optional(),
  comment: z.string().max(1000).optional(),
  wouldRecommend: z.boolean().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const rateCheck = rateLimitMiddleware(user?.id || "anon", "list-reviews", 60);
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const page = Math.max(1, parseInt(new URL(request.url).searchParams.get("page") || "1"));
  const limit = Math.min(50, parseInt(new URL(request.url).searchParams.get("limit") || "10"));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data: reviews, count, error } = await supabase
    .from("route_reviews")
    .select(`
      *,
      user:user_id (id, name, username, avatar)
    `, { count: "exact" })
    .eq("route_id", id)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const formatted = (reviews || []).map((r: any) => ({
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
  }));

  return NextResponse.json({
    data: formatted,
    meta: { total: count || 0, page, limit },
  });
}

export async function POST(
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

  const rateCheck = rateLimitMiddleware(user.id, "create-review", 10);
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { data: existing } = await supabase
    .from("route_reviews")
    .select("id")
    .eq("route_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "You have already reviewed this route" }, { status: 409 });
  }

  const body = await request.json();
  const parsed = validateBody(createReviewSchema, body);
  if (!parsed.success) return parsed.response;

  const { data: review, error } = await supabase
    .from("route_reviews")
    .insert({
      route_id: id,
      user_id: user.id,
      rating: parsed.data.rating,
      difficulty_rating: parsed.data.difficultyRating || null,
      safety_rating: parsed.data.safetyRating || null,
      cleanliness_rating: parsed.data.cleanlinessRating || null,
      crowd_rating: parsed.data.crowdRating || null,
      lighting_rating: parsed.data.lightingRating || null,
      water_availability: parsed.data.waterAvailability || null,
      comment: parsed.data.comment || null,
      would_recommend: parsed.data.wouldRecommend ?? true,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: review }, { status: 201 });
}
