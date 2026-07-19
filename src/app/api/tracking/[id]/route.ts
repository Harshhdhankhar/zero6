import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

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

  const { data: session, error } = await supabase
    .from("run_sessions")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (session.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    data: {
      id: session.id,
      userId: session.user_id,
      status: session.status,
      startTime: session.start_time,
      endTime: session.end_time,
      duration: session.duration,
      distance: session.distance,
      pace: session.pace,
      calories: session.calories,
      elevationGain: session.elevation_gain,
      elevationLoss: session.elevation_loss,
      avgHeartRate: session.avg_heart_rate,
      maxHeartRate: session.max_heart_rate,
      avgCadence: session.avg_cadence,
      route: session.route || [],
      splits: session.splits || [],
      paceHistory: session.pace_history || [],
      distanceHistory: session.distance_history || [],
      activityId: session.activity_id,
      createdAt: session.created_at,
    },
  });
}
