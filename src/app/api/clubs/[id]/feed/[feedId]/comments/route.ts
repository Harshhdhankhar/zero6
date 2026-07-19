import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; feedId: string }> }
) {
  const { feedId } = await params;
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("feed_comments")
    .select(`*, profiles:user_id (id, name, username, avatar)`)
    .eq("feed_id", feedId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    data: (data || []).map((c: any) => ({
      id: c.id, content: c.content, parentId: c.parent_id, createdAt: c.created_at,
      user: c.profiles ? { id: c.profiles.id, name: c.profiles.name, username: c.profiles.username, avatar: c.profiles.avatar } : null,
    })),
  });
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
  const { content, parentId } = body;
  if (!content?.trim()) return NextResponse.json({ error: "Content required" }, { status: 400 });

  const { data, error } = await supabase.from("feed_comments").insert({
    feed_id: feedId, user_id: user.id, content, parent_id: parentId || null,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await supabase.rpc("increment_feed_comments", { p_feed_id: feedId, p_delta: 1 });
  return NextResponse.json({ data }, { status: 201 });
}
