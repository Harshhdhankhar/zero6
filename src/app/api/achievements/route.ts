import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createServerSupabaseClient();

  const { data: achievements, error } = await supabase
    .from("achievements")
    .select("*")
    .order("xp_reward", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userProgress: Record<string, { progress: number; unlocked_at: string | null }> = {};
  if (user) {
    const { data: userAchievements } = await supabase
      .from("user_achievements")
      .select("achievement_id, progress, unlocked_at")
      .eq("user_id", user.id);
    (userAchievements || []).forEach((ua: { achievement_id: string; progress: number; unlocked_at: string | null }) => {
      userProgress[ua.achievement_id] = {
        progress: ua.progress,
        unlocked_at: ua.unlocked_at,
      };
    });
  }

  const formatted = (achievements || []).map((a: any) => {
    const ua = userProgress[a.id];
    const isUnlocked = !!ua?.unlocked_at;
    return {
      id: a.id,
      title: a.title,
      description: a.description,
      icon: a.icon,
      category: a.category,
      isUnlocked,
      unlockedAt: ua?.unlocked_at || undefined,
      progress: ua?.progress ?? 0,
      target: a.target,
      xpReward: a.xp_reward,
      rarity: a.rarity,
    };
  });

  return NextResponse.json({
    data: formatted,
    meta: {
      total: formatted.length,
      unlocked: formatted.filter((a) => a.isUnlocked).length,
    },
  });
}
