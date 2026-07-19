import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { rateLimitMiddleware } from "@/lib/rate-limit";
import { z } from "zod";

const waypointSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  altitude: z.number().optional(),
  accuracy: z.number().optional(),
  speed: z.number().optional(),
  heartRate: z.number().int().optional(),
  cadence: z.number().int().optional(),
  pace: z.number().optional(),
  timestamp: z.string().datetime().optional(),
});

const locationSchema = z.object({
  sessionId: z.string().uuid("Invalid session ID"),
  waypoints: z
    .array(waypointSchema)
    .min(1, "At least one waypoint is required")
    .max(50, "Maximum 50 waypoints per request"),
});

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateCheck = rateLimitMiddleware(user.id, "submitLocation", 300, 60000);
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await request.json();
  const parsed = locationSchema.safeParse(body);
  if (!parsed.success) {
    const details = parsed.error.issues.map((i) => ({
      field: i.path.join("."),
      message: i.message,
    }));
    return NextResponse.json(
      { error: "Validation failed", details },
      { status: 400 }
    );
  }

  const { sessionId, waypoints } = parsed.data;

  const { data: session, error: sessionError } = await supabase
    .from("run_sessions")
    .select("user_id, route")
    .eq("id", sessionId)
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (session.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const waypointRows = waypoints.map((wp) => ({
    session_id: sessionId,
    latitude: wp.latitude,
    longitude: wp.longitude,
    altitude: wp.altitude ?? 0,
    accuracy: wp.accuracy ?? 0,
    speed: wp.speed ?? 0,
    heart_rate: wp.heartRate ?? null,
    cadence: wp.cadence ?? null,
    pace: wp.pace ?? 0,
    timestamp: wp.timestamp ?? new Date().toISOString(),
  }));

  const { error: insertError } = await supabase
    .from("tracking_waypoints")
    .insert(waypointRows);

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const latestWaypoint = waypoints[waypoints.length - 1];
  const existingRoute = (session.route as Array<{ latitude: number; longitude: number }>) || [];
  const updatedRoute = [
    ...existingRoute,
    { latitude: latestWaypoint.latitude, longitude: latestWaypoint.longitude },
  ];

  await supabase
    .from("run_sessions")
    .update({ route: updatedRoute })
    .eq("id", sessionId);

  return NextResponse.json({ data: { count: waypoints.length } });
}
