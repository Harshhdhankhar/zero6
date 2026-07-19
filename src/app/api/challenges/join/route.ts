import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";
import { joinChallengeSchema, validateBody } from "@/lib/validations";
import { rateLimitMiddleware } from "@/lib/rate-limit";

// POST /api/challenges/join — Join a challenge
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateCheck = rateLimitMiddleware(user.id, "joinChallenge");
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await request.json();
  const parsed = validateBody(joinChallengeSchema, body);
  if (!parsed.success) return parsed.response;
  const challengeId = parsed.data.challengeId;

  const { error } = await supabase.from("challenge_participants").insert({
    challenge_id: challengeId,
    user_id: user.id,
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Already joined" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Increment participant count
  await supabase.rpc("increment_challenge_participant_count", {
    p_challenge_id: challengeId,
    p_delta: 1,
  });

  return NextResponse.json({ message: "Joined challenge" }, { status: 201 });
}
