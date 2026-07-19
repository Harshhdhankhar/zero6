import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { rateLimitMiddleware } from "@/lib/rate-limit";
import { z } from "zod";

const stopSchema = z.object({
  sessionId: z.string().uuid("Invalid session ID"),
  title: z.string().max(100).optional(),
  isPublic: z.boolean().optional(),
});

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateCheck = rateLimitMiddleware(user.id, "stopRun", 10, 3600000);
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await request.json();
  const parsed = stopSchema.safeParse(body);
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

  const { sessionId, title, isPublic } = parsed.data;

  const { data: session, error: sessionError } = await supabase
    .from("run_sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (session.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (session.status !== "active" && session.status !== "paused") {
    return NextResponse.json(
      { error: "Session is not active or paused" },
      { status: 400 }
    );
  }

  const { data: waypoints, error: waypointsError } = await supabase
    .from("tracking_waypoints")
    .select("*")
    .eq("session_id", sessionId)
    .order("timestamp", { ascending: true });

  if (waypointsError) {
    return NextResponse.json({ error: waypointsError.message }, { status: 500 });
  }

  const endTime = new Date().toISOString();
  const startTime = new Date(session.start_time).getTime();
  const duration = Math.round((Date.now() - startTime) / 1000);

  let distance = 0;
  let elevationGain = 0;
  let elevationLoss = 0;
  let maxHeartRate = 0;
  let heartRateSum = 0;
  let heartRateCount = 0;
  let cadenceSum = 0;
  let cadenceCount = 0;

  if (waypoints && waypoints.length > 1) {
    for (let i = 1; i < waypoints.length; i++) {
      const prev = waypoints[i - 1];
      const curr = waypoints[i];
      const d = haversineDistance(
        prev.latitude,
        prev.longitude,
        curr.latitude,
        curr.longitude
      );
      distance += d;

      const altDiff = (curr.altitude ?? 0) - (prev.altitude ?? 0);
      if (altDiff > 0) elevationGain += altDiff;
      else elevationLoss += Math.abs(altDiff);
    }

    for (const wp of waypoints) {
      if (wp.heart_rate) {
        heartRateSum += wp.heart_rate;
        heartRateCount++;
        if (wp.heart_rate > maxHeartRate) maxHeartRate = wp.heart_rate;
      }
      if (wp.cadence) {
        cadenceSum += wp.cadence;
        cadenceCount++;
      }
    }
  }

  const pace = distance > 0 ? Math.round((duration / (distance / 1000)) * 10) / 10 : 0;

  const distanceKm = distance / 1000;
  const splits: Array<{ distance: number; pace: number; splitIndex: number }> = [];

  if (waypoints && waypoints.length > 1) {
    let cumulativeDistance = 0;
    let splitStartDistance = 0;
    let splitStartIndex = 0;
    let splitIndex = 0;

    for (let i = 1; i < waypoints.length; i++) {
      const prev = waypoints[i - 1];
      const curr = waypoints[i];
      const d = haversineDistance(
        prev.latitude,
        prev.longitude,
        curr.latitude,
        curr.longitude
      );
      cumulativeDistance += d;

      while (cumulativeDistance >= splitStartDistance + 1000) {
        const splitEndDistance = splitStartDistance + 1000;
        const ratio =
          (splitEndDistance - splitStartDistance) /
          (cumulativeDistance - splitStartDistance);
        const splitDuration =
          (new Date(curr.timestamp).getTime() -
            new Date(waypoints[splitStartIndex].timestamp).getTime()) /
          1000;
        const splitPace = Math.round((splitDuration / 1000) * 10) / 10;
        splits.push({
          distance: 1,
          pace: splitPace,
          splitIndex,
        });
        splitStartDistance = splitEndDistance;
        splitStartIndex = i;
        splitIndex++;
      }
    }

    const remainingDistance = cumulativeDistance - splitStartDistance;
    if (remainingDistance > 0 && splits.length > 0) {
      const remainingDuration =
        (new Date(
          waypoints[waypoints.length - 1].timestamp
        ).getTime() -
          new Date(waypoints[splitStartIndex].timestamp).getTime()) /
        1000;
      const remainingPace =
        remainingDistance > 0
          ? Math.round((remainingDuration / (remainingDistance / 1000)) * 10) / 10
          : 0;
      splits.push({
        distance: Math.round(remainingDistance * 1000) / 1000,
        pace: remainingPace,
        splitIndex,
      });
    }
  }

  const calories = Math.round(duration * 0.07);

  const route = (waypoints || []).map((wp) => ({
    latitude: wp.latitude,
    longitude: wp.longitude,
    altitude: wp.altitude,
    speed: wp.speed,
    heartRate: wp.heart_rate,
    cadence: wp.cadence,
    timestamp: wp.timestamp,
  }));

  const { data: activity, error: activityError } = await supabase
    .from("activities")
    .insert({
      user_id: user.id,
      type: "run",
      title: title || "GPS Run",
      description: "",
      distance,
      duration,
      pace,
      calories,
      elevation_gain: Math.round(elevationGain * 100) / 100,
      elevation_loss: Math.round(elevationLoss * 100) / 100,
      heart_rate_avg:
        heartRateCount > 0 ? Math.round(heartRateSum / heartRateCount) : null,
      heart_rate_max: maxHeartRate > 0 ? maxHeartRate : null,
      cadence_avg:
        cadenceCount > 0 ? Math.round(cadenceSum / cadenceCount) : null,
      route,
      splits,
      source: "gps",
      original_session_id: sessionId,
      is_public: isPublic ?? true,
    })
    .select()
    .single();

  if (activityError) {
    return NextResponse.json({ error: activityError.message }, { status: 500 });
  }

  const { error: updateError } = await supabase
    .from("run_sessions")
    .update({
      status: "completed",
      end_time: endTime,
      duration,
      distance,
      pace,
      calories,
      elevation_gain: Math.round(elevationGain * 100) / 100,
      elevation_loss: Math.round(elevationLoss * 100) / 100,
      avg_heart_rate:
        heartRateCount > 0 ? Math.round(heartRateSum / heartRateCount) : null,
      max_heart_rate: maxHeartRate > 0 ? maxHeartRate : null,
      avg_cadence:
        cadenceCount > 0 ? Math.round(cadenceSum / cadenceCount) : null,
      route,
      splits,
      activity_id: activity.id,
    })
    .eq("id", sessionId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  await supabase.rpc("check_challenge_completions", {
    p_user_id: user.id,
  });

  await supabase.rpc("check_and_award_achievements", {
    p_user_id: user.id,
  });

  return NextResponse.json({
    data: {
      activityId: activity.id,
      sessionId,
      stats: {
        distance: Math.round(distance * 100) / 100,
        duration,
        pace,
        calories,
        elevationGain: Math.round(elevationGain * 100) / 100,
        splits,
      },
    },
  });
}
