import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { rateLimitMiddleware } from "@/lib/rate-limit";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(_request.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 50);
  const offset = parseInt(url.searchParams.get("offset") || "0");

  const { data, error, count } = await supabase
    .from("community_feed")
    .select(`
      *, profiles:user_id (id, name, username, avatar),
      feed_likes (user_id, reaction_type),
      feed_comments (id, user_id, content, created_at, profiles:user_id (id, name, username, avatar))
    `, { count: "exact" })
    .eq("club_id", id)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const formatted = (data || []).map((post: any) => ({
    id: post.id,
    content: post.content,
    imageUrl: post.image_url,
    videoUrl: post.video_url,
    activityId: post.activity_id,
    routeId: post.route_id,
    achievementId: post.achievement_id,
    postType: post.post_type,
    isPinned: post.is_pinned,
    likesCount: post.likes_count,
    commentsCount: post.comments_count,
    tags: post.tags || [],
    createdAt: post.created_at,
    user: post.profiles ? { id: post.profiles.id, name: post.profiles.name, username: post.profiles.username, avatar: post.profiles.avatar } : null,
    isLiked: post.feed_likes?.some((l: any) => l.user_id === user.id) || false,
    comments: (post.feed_comments || []).map((c: any) => ({
      id: c.id, content: c.content, createdAt: c.created_at,
      user: c.profiles ? { id: c.profiles.id, name: c.profiles.name, username: c.profiles.username, avatar: c.profiles.avatar } : null,
    })),
  }));

  return NextResponse.json({ data: formatted, meta: { total: count || 0, limit, offset } });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { content, imageUrl, videoUrl, postType, activityId, routeId, achievementId, isPinned } = body;

  if (!content?.trim() && !imageUrl && !videoUrl) {
    return NextResponse.json({ error: "Post must have text, image, or video" }, { status: 400 });
  }

  const { data, error } = await supabase.from("community_feed").insert({
    club_id: id, user_id: user.id,
    content: content || null,
    image_url: imageUrl || null,
    video_url: videoUrl || null,
    post_type: postType || "post",
    activity_id: activityId || null,
    route_id: routeId || null,
    achievement_id: achievementId || null,
    is_pinned: isPinned || false,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
