import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { rateLimitMiddleware } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { searchParams } = new URL(request.url);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateCheck = rateLimitMiddleware(user.id, "list-live-runs", 30);
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const followingIds: string[] = [];
  const { data: followData } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", user.id);
  if (followData) {
    followingIds.push(...followData.map((f: any) => f.following_id));
  }

  const { data: runs, error } = await supabase
    .from("live_runs")
    .select(`
      *,
      profile:user_id (id, name, username, avatar)
    `)
    .eq("status", "active")
    .order("started_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const visible = (runs || []).filter((r: any) => {
    if (r.user_id === user.id) return true;
    if (r.visibility === "friends" && followingIds.includes(r.user_id)) return true;
    if (r.visibility === "followers" && followingIds.includes(r.user_id)) return true;
    if (r.visibility === "club") return true;
    return false;
  });

  const formatted = visible.map((r: any) => ({
    id: r.id,
    userId: r.user_id,
    userName: r.profile?.name || "Runner",
    userAvatar: r.profile?.avatar || "",
    status: r.status,
    currentLatitude: r.current_latitude,
    currentLongitude: r.current_longitude,
    currentPace: r.current_pace,
    averagePace: r.average_pace,
    distance: r.distance,
    duration: r.duration,
    elevationGain: r.elevation_gain,
    visibility: r.visibility,
    allowJoin: r.allow_join,
    allowCheers: r.allow_cheers,
    startedAt: r.started_at,
  }));

  return NextResponse.json({
    data: formatted,
    meta: { total: formatted.length },
  });
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateCheck = rateLimitMiddleware(user.id, "upsert-live-run", 60);
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await request.json();

  const payload = {
    user_id: user.id,
    status: body.status || "active",
    current_latitude: body.currentLatitude ?? null,
    current_longitude: body.currentLongitude ?? null,
    current_pace: body.currentPace ?? 0,
    average_pace: body.averagePace ?? 0,
    distance: body.distance ?? 0,
    duration: body.duration ?? 0,
    elevation_gain: body.elevationGain ?? 0,
    route: body.route ?? [],
    visibility: body.visibility || "friends",
    allow_join: body.allowJoin ?? false,
    allow_cheers: body.allowCheers ?? true,
  };

  const { data: existing } = await supabase
    .from("live_runs")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  let result;
  if (existing) {
    const { data, error } = await supabase
      .from("live_runs")
      .update(payload)
      .eq("id", existing.id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    result = data;
  } else {
    const { data, error } = await supabase
      .from("live_runs")
      .insert(payload)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    result = data;
  }

  return NextResponse.json({ data: { id: result.id } }, { status: 201 });
}
