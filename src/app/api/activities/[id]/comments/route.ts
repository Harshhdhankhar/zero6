import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { commentSchema, validateBody } from "@/lib/validations";
import { rateLimitMiddleware } from "@/lib/rate-limit";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: comments, error } = await supabase
    .from("activity_comments")
    .select(`
      *,
      profiles:user_id (id, name, username, avatar)
    `)
    .eq("activity_id", id)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const formatted = (comments || []).map((c: any) => ({
    id: c.id,
    activityId: c.activity_id,
    userId: c.user_id,
    userName: c.profiles?.name || "Unknown",
    userAvatar: c.profiles?.avatar || "",
    content: c.content,
    createdAt: c.created_at,
  }));

  return NextResponse.json({ data: formatted });
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

  const rateCheck = rateLimitMiddleware(user.id, "commentActivity");
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await request.json();
  const parsed = validateBody(commentSchema, body);
  if (!parsed.success) return parsed.response;

  const { data: comment, error } = await supabase
    .from("activity_comments")
    .insert({
      activity_id: id,
      user_id: user.id,
      content: body.content.trim(),
    })
    .select(`
      *,
      profiles:user_id (id, name, username, avatar)
    `)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.rpc("increment_activity_comments_count", {
    p_activity_id: id,
    p_delta: 1,
  });

  // Notify activity owner
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
      type: "comment",
      title: `${profile?.name || "Someone"} commented on your activity`,
      message: body.content.trim().slice(0, 100),
      avatar: profile?.avatar || "",
      sender_id: user.id,
      receiver_id: activity.user_id,
      action_url: `/activities`,
    });
  }

  return NextResponse.json(
    {
      data: {
        id: comment.id,
        activityId: comment.activity_id,
        userId: comment.user_id,
        userName: comment.profiles?.name || "Unknown",
        userAvatar: comment.profiles?.avatar || "",
        content: comment.content,
        createdAt: comment.created_at,
      },
    },
    { status: 201 }
  );
}
