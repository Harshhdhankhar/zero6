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

  const rateCheck = rateLimitMiddleware(user.id, "challenge-detail", 60);
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { data: challenge, error } = await supabase
    .from("challenges")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !challenge) {
    return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
  }

  let isJoined = false;
  let progress = 0;

  const { data: participation } = await supabase
    .from("challenge_participants")
    .select("current")
    .eq("challenge_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (participation) {
    isJoined = true;
    progress = participation.current;
  }

  return NextResponse.json({
    data: {
      id: challenge.id,
      title: challenge.title,
      description: challenge.description,
      icon: challenge.icon,
      type: challenge.type,
      target: challenge.target,
      current: progress,
      unit: challenge.unit,
      startDate: challenge.start_date,
      endDate: challenge.end_date,
      participantCount: challenge.participant_count,
      isJoined,
      progress,
      reward: challenge.reward,
      rewardXP: challenge.reward_xp,
      difficulty: challenge.difficulty,
    },
  });
}
