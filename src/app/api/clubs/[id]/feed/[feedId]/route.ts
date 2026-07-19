import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; feedId: string }> }
) {
  const { id, feedId } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: post } = await supabase.from("community_feed").select("user_id").eq("id", feedId).single();
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isAdmin = (await supabase.from("club_members").select("role").eq("club_id", id).eq("user_id", user.id).maybeSingle())
    ?.data as { role: string } | null;

  if (post.user_id !== user.id && (!isAdmin ||     !["owner", "moderator"].includes(isAdmin.role))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabase.from("community_feed").delete().eq("id", feedId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: "Deleted" });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; feedId: string }> }
) {
  const { feedId } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { action } = body;

  if (action === "like") {
    const existing = await supabase.from("feed_likes")
      .select("id").eq("feed_id", feedId).eq("user_id", user.id).maybeSingle();
    if (existing.data) return NextResponse.json({ message: "Already liked" });
    const { error: likeError } = await supabase.from("feed_likes").insert(
      { feed_id: feedId, user_id: user.id, reaction_type: "like" }
    );
    if (likeError) return NextResponse.json({ error: likeError.message }, { status: 500 });
    await supabase.rpc("increment_feed_likes", { p_feed_id: feedId, p_delta: 1 });
    return NextResponse.json({ message: "Liked" });
  }

  if (action === "unlike") {
    await supabase.from("feed_likes").delete().eq("feed_id", feedId).eq("user_id", user.id);
    await supabase.rpc("increment_feed_likes", { p_feed_id: feedId, p_delta: -1 });
    return NextResponse.json({ message: "Unliked" });
  }

  if (action === "pin") {
    const isAdmin = (await supabase.from("club_members").select("role").eq("club_id", (await supabase.from("community_feed").select("club_id").eq("id", feedId).single()).data?.club_id).eq("user_id", user.id).maybeSingle())?.data as { role: string } | null;
    if (!isAdmin || !["owner", "moderator"].includes(isAdmin.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await supabase.from("community_feed").update({ is_pinned: body.pinned !== false }).eq("id", feedId);
    return NextResponse.json({ message: body.pinned !== false ? "Pinned" : "Unpinned" });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
