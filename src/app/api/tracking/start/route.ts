import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { rateLimitMiddleware } from "@/lib/rate-limit";

export async function POST() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateCheck = rateLimitMiddleware(user.id, "startRun", 10, 3600000);
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const sessionId = crypto.randomUUID();
  const startTime = new Date().toISOString();

  const { error } = await supabase.from("run_sessions").insert({
    id: sessionId,
    user_id: user.id,
    status: "active",
    start_time: startTime,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { data: { sessionId, startTime } },
    { status: 201 }
  );
}
