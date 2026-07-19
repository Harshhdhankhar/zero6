import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const twentyFourHoursAgo = new Date(
    Date.now() - 24 * 60 * 60 * 1000
  ).toISOString();

  const { data, error } = await supabase
    .from("user_achievements")
    .select("unlocked_at, achievement:achievements(*)")
    .eq("user_id", user.id)
    .not("unlocked_at", "is", null)
    .gte("unlocked_at", twentyFourHoursAgo)
    .order("unlocked_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const recent = (data || []).map((ua: any) => ({
    id: ua.achievement.id,
    title: ua.achievement.title,
    description: ua.achievement.description,
    icon: ua.achievement.icon,
    unlockedAt: ua.unlocked_at,
  }));

  return NextResponse.json({ data: recent });
}
