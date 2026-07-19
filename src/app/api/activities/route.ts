import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { activitySchema, validateBody } from "@/lib/validations";
import { rateLimitMiddleware } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  let query = supabase
    .from("activities")
    .select(`
      *,
      profiles:user_id (id, name, username, avatar)
    `)
    .order("created_at", { ascending: false })
    .limit(20);

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data: activities, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let likedActivityIds: string[] = [];
  if (user) {
    const { data: likeData } = await supabase
      .from("activity_likes")
      .select("activity_id")
      .eq("user_id", user.id);
    likedActivityIds = (likeData || []).map((l: { activity_id: string }) => l.activity_id);
  }

  // Transform to match the expected frontend shape
  const formatted = (activities || []).map((a: any) => ({
    id: a.id,
    userId: a.user_id,
    userName: a.profiles?.name || "Unknown",
    userAvatar: a.profiles?.avatar || "",
    type: a.type,
    title: a.title,
    description: a.description || "",
    distance: a.distance,
    duration: a.duration,
    pace: a.pace,
    calories: a.calories,
    elevationGain: a.elevation_gain,
    heartRateAvg: a.heart_rate_avg,
    heartRateMax: a.heart_rate_max,
    cadenceAvg: a.cadence_avg,
    route: a.route || [],
    splits: a.splits || [],
    date: a.created_at,
    likes: a.likes_count,
    comments: a.comments_count,
    isLiked: likedActivityIds.includes(a.id),
    mapImageUrl: a.map_image_url,
  }));

  return NextResponse.json({
    data: formatted,
    meta: { total: formatted.length, page: 1, limit: 20 },
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

  const rateCheck = rateLimitMiddleware(user.id, "createActivity");
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await request.json();
  const parsed = validateBody(activitySchema, body);
  if (!parsed.success) return parsed.response;

  const { data: activity, error } = await supabase
    .from("activities")
    .insert({
      user_id: user.id,
      type: parsed.data.type,
      title: parsed.data.title,
      description: parsed.data.description || "",
      distance: parsed.data.distance,
      duration: parsed.data.duration,
      pace: body.pace || 0,
      calories: body.calories || 0,
      elevation_gain: body.elevationGain || 0,
      heart_rate_avg: body.heartRateAvg,
      heart_rate_max: body.heartRateMax,
      cadence_avg: body.cadenceAvg,
      route: body.route || [],
      splits: body.splits || [],
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Update user stats
  await supabase.rpc("increment_user_stats", {
    p_user_id: user.id,
    p_distance: body.distance || 0,
    p_duration: body.duration || 0,
  });

  return NextResponse.json({ data: activity }, { status: 201 });
}
