import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { rateLimitMiddleware } from "@/lib/rate-limit";

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

  const rateCheck = rateLimitMiddleware(user.id, "like-route", 30);
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { data: existing } = await supabase
    .from("route_likes")
    .select("id")
    .eq("route_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("route_likes")
      .delete()
      .eq("route_id", id)
      .eq("user_id", user.id);

    const { count } = await supabase
      .from("route_likes")
      .select("*", { count: "exact", head: true })
      .eq("route_id", id);

    return NextResponse.json({ data: { liked: false, count: count || 0 } });
  }

  const { error } = await supabase
    .from("route_likes")
    .insert({ route_id: id, user_id: user.id });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { count } = await supabase
    .from("route_likes")
    .select("*", { count: "exact", head: true })
    .eq("route_id", id);

  return NextResponse.json({ data: { liked: true, count: count || 0 } });
}

export async function DELETE(
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

  const rateCheck = rateLimitMiddleware(user.id, "unlike-route", 30);
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  await supabase
    .from("route_likes")
    .delete()
    .eq("route_id", id)
    .eq("user_id", user.id);

  const { count } = await supabase
    .from("route_likes")
    .select("*", { count: "exact", head: true })
    .eq("route_id", id);

  return NextResponse.json({ data: { liked: false, count: count || 0 } });
}
