import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";
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

  const rateCheck = rateLimitMiddleware(user.id, "likeCommunityPhoto", 30);
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { error } = await supabase.from("activity_photo_likes").upsert(
    { photo_id: id, user_id: user.id },
    { onConflict: "photo_id,user_id" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { count } = await supabase
    .from("activity_photo_likes")
    .select("*", { count: "exact", head: true })
    .eq("photo_id", id);

  const serviceClient = await createServiceRoleClient();
  await serviceClient
    .from("activity_photos")
    .update({ likes: count || 0 })
    .eq("id", id);

  return NextResponse.json({ message: "Liked", likes: count }, { status: 201 });
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

  const rateCheck = rateLimitMiddleware(user.id, "likeCommunityPhoto", 30);
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { error } = await supabase
    .from("activity_photo_likes")
    .delete()
    .eq("photo_id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { count } = await supabase
    .from("activity_photo_likes")
    .select("*", { count: "exact", head: true })
    .eq("photo_id", id);

  const serviceClient = await createServiceRoleClient();
  await serviceClient
    .from("activity_photos")
    .update({ likes: count || 0 })
    .eq("id", id);

  return NextResponse.json({ message: "Unliked", likes: count || 0 });
}
