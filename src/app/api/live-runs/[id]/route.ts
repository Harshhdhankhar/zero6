import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { rateLimitMiddleware } from "@/lib/rate-limit";

export async function GET(
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

  const rateCheck = rateLimitMiddleware(user.id, "get-live-run", 30);
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { data: run, error } = await supabase
    .from("live_runs")
    .select(`
      *,
      profile:user_id (id, name, username, avatar)
    `)
    .eq("id", id)
    .single();

  if (error || !run) {
    return NextResponse.json({ error: "Live run not found" }, { status: 404 });
  }

  const [cheersRes, participantsRes] = await Promise.all([
    supabase.from("live_run_cheers").select("id", { count: "exact", head: true }).eq("live_run_id", id),
    supabase.from("live_run_participants").select("id", { count: "exact", head: true }).eq("live_run_id", id).eq("status", "joined"),
  ]);

  const formatted = {
    id: run.id,
    userId: run.user_id,
    userName: run.profile?.name || "Runner",
    userAvatar: run.profile?.avatar || "",
    status: run.status,
    currentLatitude: run.current_latitude,
    currentLongitude: run.current_longitude,
    currentPace: run.current_pace,
    averagePace: run.average_pace,
    distance: run.distance,
    duration: run.duration,
    elevationGain: run.elevation_gain,
    route: run.route,
    visibility: run.visibility,
    allowJoin: run.allow_join,
    allowCheers: run.allow_cheers,
    startedAt: run.started_at,
    cheersCount: cheersRes.count || 0,
    participantsCount: participantsRes.count || 0,
  };

  return NextResponse.json({ data: formatted });
}
