import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createServerSupabaseClient();

  const { data: challenges, error } = await supabase
    .from("challenges")
    .select("*")
    .order("start_date", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Check current user participation
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let participations: Record<string, number> = {};
  if (user) {
    const { data: partData } = await supabase
      .from("challenge_participants")
      .select("challenge_id, current")
      .eq("user_id", user.id);
    (partData || []).forEach((p: any) => {
      participations[p.challenge_id] = p.current;
    });
  }

  const formatted = (challenges || []).map((c: any) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    icon: c.icon,
    type: c.type,
    target: c.target,
    current: participations[c.id] ?? 0,
    unit: c.unit,
    startDate: c.start_date,
    endDate: c.end_date,
    participantCount: c.participant_count,
    isJoined: c.id in participations,
    reward: c.reward,
    rewardXP: c.reward_xp,
    difficulty: c.difficulty,
  }));

  return NextResponse.json({
    data: formatted,
    meta: { total: formatted.length },
  });
}
