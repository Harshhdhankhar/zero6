import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { redeemRewardSchema, validateBody } from "@/lib/validations";
import { rateLimitMiddleware } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateCheck = rateLimitMiddleware(user.id, "redeemReward");
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await request.json();
  const parsed = validateBody(redeemRewardSchema, body);
  if (!parsed.success) return parsed.response;
  const { rewardId, cost } = parsed.data;

  // Get user's current XP
  const { data: profile } = await supabase
    .from("profiles")
    .select("xp")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  if (profile.xp < cost) {
    return NextResponse.json({ error: "Insufficient XP" }, { status: 400 });
  }

  // Deduct XP
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ xp: profile.xp - cost })
    .eq("id", user.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Record redemption
  const { error: redemptionError } = await supabase.from("reward_redemptions").insert({
    user_id: user.id,
    reward_id: rewardId,
    cost: cost,
  });

  if (redemptionError) {
    // Rollback XP deduction if redemption record fails
    await supabase
      .from("profiles")
      .update({ xp: profile.xp })
      .eq("id", user.id);
    return NextResponse.json({ error: redemptionError.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Reward redeemed successfully" }, { status: 200 });
}
