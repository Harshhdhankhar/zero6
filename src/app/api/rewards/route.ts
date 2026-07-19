import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { rateLimitMiddleware } from "@/lib/rate-limit";

export async function GET() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateCheck = rateLimitMiddleware(user.id, "rewards-catalog", 30);
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { data: rewards, error } = await supabase
    .from("rewards_catalog")
    .select("*")
    .order("cost", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("xp")
    .eq("id", user.id)
    .single();

  const userXp = profile?.xp || 0;

  const formatted = (rewards || []).map((r: any) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    icon: r.icon,
    cost: r.cost,
    isRedeemable: userXp >= r.cost,
  }));

  return NextResponse.json({
    data: formatted,
    meta: { total: formatted.length },
  });
}
