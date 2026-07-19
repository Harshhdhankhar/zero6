import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  // Look up by UUID or username
  const isUuid = /^[0-9a-f-]{36}$/i.test(id);
  let query = supabase.from("profiles").select("*");
  query = isUuid ? query.eq("id", id) : query.eq("username", id);

  const { data: profile, error } = await query.single();

  if (error || !profile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isFollowing = false;
  if (user && user.id !== profile.id) {
    const { data: follow } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", user.id)
      .eq("following_id", profile.id)
      .maybeSingle();
    isFollowing = !!follow;
  }

  return NextResponse.json({
    data: {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      username: profile.username,
      avatar: profile.avatar || "",
      bio: profile.bio || "",
      location: profile.location || "",
      role: profile.role,
      totalDistance: profile.total_distance,
      totalRuns: profile.total_runs,
      totalDuration: profile.total_duration,
      currentStreak: profile.current_streak,
      longestStreak: profile.longest_streak,
      level: profile.level,
      xp: profile.xp,
      xpToNextLevel: profile.xp_to_next_level,
      followers: profile.followers_count,
      following: profile.following_count,
      joinedAt: profile.created_at,
      isFollowing,
      isCurrentUser: user?.id === profile.id,
    },
  });
}
