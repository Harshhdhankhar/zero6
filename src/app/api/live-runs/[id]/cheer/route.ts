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

  const rateCheck = rateLimitMiddleware(user.id, "cheer-live-run", 20);
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await request.json();
  const reactionType = body.reactionType || "cheer";
  const message = body.message || null;

  const validReactions = ["cheer", "fire", "clap", "wave", "good_job", "keep_going"];
  if (!validReactions.includes(reactionType)) {
    return NextResponse.json({ error: "Invalid reaction type" }, { status: 400 });
  }

  const { error } = await supabase.from("live_run_cheers").upsert(
    {
      live_run_id: id,
      user_id: user.id,
      reaction_type: reactionType,
      message,
    },
    { onConflict: "live_run_id,user_id" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Cheer sent" }, { status: 201 });
}
