import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { rateLimitMiddleware } from "@/lib/rate-limit";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: activity, error } = await supabase
    .from("activities")
    .select(`
      *,
      profiles:user_id (id, name, username, avatar)
    `)
    .eq("id", id)
    .single();

  if (error || !activity) {
    return NextResponse.json({ error: "Activity not found" }, { status: 404 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let likedCount = 0;
  let commentCount = 0;
  let isLiked = false;

  if (activity.id) {
    const { count: lc } = await supabase
      .from("activity_likes")
      .select("*", { count: "exact", head: true })
      .eq("activity_id", activity.id);
    likedCount = lc || 0;

    const { count: cc } = await supabase
      .from("activity_comments")
      .select("*", { count: "exact", head: true })
      .eq("activity_id", activity.id);
    commentCount = cc || 0;

    if (user) {
      const { data: likeData } = await supabase
        .from("activity_likes")
        .select("id")
        .eq("activity_id", activity.id)
        .eq("user_id", user.id)
        .maybeSingle();
      isLiked = !!likeData;
    }
  }

  const formatted = {
    id: activity.id,
    userId: activity.user_id,
    userName: activity.profiles?.name || "Unknown",
    userAvatar: activity.profiles?.avatar || "",
    type: activity.type,
    title: activity.title,
    description: activity.description || "",
    distance: activity.distance || 0,
    duration: activity.duration || 0,
    pace: activity.pace || 0,
    calories: activity.calories || 0,
    elevationGain: activity.elevation_gain || 0,
    heartRateAvg: activity.avg_heart_rate || 0,
    heartRateMax: activity.max_heart_rate || 0,
    cadenceAvg: activity.avg_cadence || 0,
    route: activity.route || [],
    splits: activity.splits || [],
    date: activity.created_at,
    likes: likedCount,
    comments: commentCount,
    isLiked,
    source: activity.source || "manual",
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

  const rateLimitResult = rateLimitMiddleware(user.id, "activity-update");
  if (!rateLimitResult.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { data: existing } = await supabase
    .from("activities")
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
  const { title, description, is_public } = body;

  const updateData: Record<string, unknown> = {};
  if (typeof title === "string") updateData.title = title;
  if (typeof description === "string") updateData.description = description;
  if (typeof is_public === "boolean") updateData.is_public = is_public;

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { error } = await supabase
    .from("activities")
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

  const rateLimitResult = rateLimitMiddleware(user.id, "activity-delete");
  if (!rateLimitResult.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { data: existing } = await supabase
    .from("activities")
    .select("user_id")
    .eq("id", id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (existing.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabase.from("activities").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: { id } });
}
