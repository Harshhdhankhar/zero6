import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { followUserSchema, validateBody } from "@/lib/validations";
import { rateLimitMiddleware } from "@/lib/rate-limit";

async function adjustFollowCounts(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  followerId: string,
  followingId: string,
  delta: number
) {
  const [{ data: follower }, { data: following }] = await Promise.all([
    supabase.from("profiles").select("following_count").eq("id", followerId).single(),
    supabase.from("profiles").select("followers_count").eq("id", followingId).single(),
  ]);

  await Promise.all([
    supabase
      .from("profiles")
      .update({
        following_count: Math.max((follower?.following_count || 0) + delta, 0),
      })
      .eq("id", followerId),
    supabase
      .from("profiles")
      .update({
        followers_count: Math.max((following?.followers_count || 0) + delta, 0),
      })
      .eq("id", followingId),
  ]);
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateCheck = rateLimitMiddleware(user.id, "followUser");
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await request.json();
  const parsed = validateBody(followUserSchema, body);
  if (!parsed.success) return parsed.response;
  const userId = parsed.data.userId;

  if (userId === user.id) {
    return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
  }

  const { error } = await supabase.from("followers").insert({
    follower_id: user.id,
    following_id: userId,
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Already following" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await adjustFollowCounts(supabase, user.id, userId, 1);

  return NextResponse.json({ message: "Followed" }, { status: 201 });
}

export async function DELETE(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = validateBody(followUserSchema, body);
  if (!parsed.success) return parsed.response;
  const userId = parsed.data.userId;

  const { error } = await supabase
    .from("followers")
    .delete()
    .eq("follower_id", user.id)
    .eq("following_id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await adjustFollowCounts(supabase, user.id, userId, -1);

  return NextResponse.json({ message: "Unfollowed" });
}
