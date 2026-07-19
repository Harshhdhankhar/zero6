import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { updateProfileSchema, validateBody } from "@/lib/validations";
import { rateLimitMiddleware } from "@/lib/rate-limit";

export async function GET() {
  const supabase = await createServerSupabaseClient();

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, email, name, username, avatar, bio, location, role, total_distance, total_runs, current_streak, level, followers_count, following_count")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let followingIds: string[] = [];
  if (user) {
    const { data: followData } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", user.id);
    followingIds = (followData || []).map((f: { following_id: string }) => f.following_id);
  }

  // Transform to camelCase for frontend
  const formatted = (profiles || []).map((p: any) => ({
    id: p.id,
    email: p.email,
    name: p.name,
    username: p.username,
    avatar: p.avatar || "",
    bio: p.bio || "",
    location: p.location || "",
    role: p.role,
    totalDistance: p.total_distance,
    totalRuns: p.total_runs,
    currentStreak: p.current_streak,
    level: p.level,
    followers: p.followers_count,
    following: p.following_count,
    isFollowing: followingIds.includes(p.id),
  }));

  return NextResponse.json({
    data: formatted,
    meta: { total: formatted.length },
  });
}

export async function PUT(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateCheck = rateLimitMiddleware(user.id, "updateProfile");
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await request.json();
  const parsed = validateBody(updateProfileSchema, body);
  if (!parsed.success) return parsed.response;

  // Only allow updating own profile
  const { data: profile, error } = await supabase
    .from("profiles")
    .update({
      name: parsed.data.name,
      username: parsed.data.username,
      bio: parsed.data.bio,
      location: parsed.data.location,
      avatar: body.avatar,
    })
    .eq("id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: profile });
}
