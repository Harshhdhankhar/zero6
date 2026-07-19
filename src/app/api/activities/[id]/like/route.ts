import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { rateLimitMiddleware } from "@/lib/rate-limit";

export async function POST(
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

  const rateCheck = rateLimitMiddleware(user.id, "likeActivity");
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { error } = await supabase.from("activity_likes").insert({
    activity_id: id,
    user_id: user.id,
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Already liked" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.rpc("increment_activity_likes_count", {
    p_activity_id: id,
    p_delta: 1,
  });

  const { data: activity } = await supabase
    .from("activities")
    .select("user_id, title")
    .eq("id", id)
    .single();

  if (activity && activity.user_id !== user.id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("name, avatar")
      .eq("id", user.id)
      .single();

    await supabase.from("notifications").insert({
      type: "like",
      title: `${profile?.name || "Someone"} liked your activity`,
      message: activity.title,
      avatar: profile?.avatar || "",
      sender_id: user.id,
      receiver_id: activity.user_id,
      action_url: `/activities`,
    });
  }

  return NextResponse.json({ message: "Liked" }, { status: 201 });
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

  const rateCheck = rateLimitMiddleware(user.id, "likeActivity");
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { error } = await supabase
    .from("activity_likes")
    .delete()
    .eq("activity_id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.rpc("increment_activity_likes_count", {
    p_activity_id: id,
    p_delta: -1,
  });

  return NextResponse.json({ message: "Unliked" });
}
