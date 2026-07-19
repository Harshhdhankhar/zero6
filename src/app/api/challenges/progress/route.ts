import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";
import { rateLimitMiddleware } from "@/lib/rate-limit";

export async function PATCH(request: NextRequest) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateCheck = rateLimitMiddleware(user.id, "challengeProgress", 20, 60000);
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await request.json();
  const { challengeId, progressDelta } = body;

  if (!challengeId || typeof progressDelta !== "number") {
    return NextResponse.json(
      { error: "Invalid body. Requires challengeId (string) and progressDelta (number)" },
      { status: 400 }
    );
  }

  const { data: participant, error: partError } = await supabase
    .from("challenge_participants")
    .select("id, current, completed")
    .eq("challenge_id", challengeId)
    .eq("user_id", user.id)
    .single();

  if (partError || !participant) {
    return NextResponse.json({ error: "Challenge participation not found" }, { status: 404 });
  }

  if (participant.completed) {
    return NextResponse.json({
      data: { progress: participant.current, status: "completed" },
    });
  }

  const newProgress = (participant.current || 0) + progressDelta;

  const { data: challenge } = await supabase
    .from("challenges")
    .select("target")
    .eq("id", challengeId)
    .single();

  if (!challenge) {
    return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
  }

  const isCompleted = newProgress >= challenge.target;

  const { error: updateError } = await supabase
    .from("challenge_participants")
    .update({
      current: newProgress,
      completed: isCompleted,
      completed_at: isCompleted ? new Date().toISOString() : null,
    })
    .eq("id", participant.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  if (isCompleted) {
    await supabase.rpc("check_challenge_completions", { p_user_id: user.id });
  }

  return NextResponse.json({
    data: {
      progress: newProgress,
      status: isCompleted ? "completed" : "active",
    },
  });
}
