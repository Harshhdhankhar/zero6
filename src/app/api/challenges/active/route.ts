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

  const { data: participation, error } = await supabase
    .from("challenge_participants")
    .select("current, completed, challenge:challenges(*)")
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const now = new Date().toISOString();

  const active = (participation || [])
    .filter((p: any) => {
      const c = p.challenge;
      if (!c) return false;
      return c.start_date <= now && c.end_date >= now;
    })
    .map((p: any) => ({
      id: p.challenge.id,
      title: p.challenge.title,
      description: p.challenge.description,
      icon: p.challenge.icon,
      type: p.challenge.type,
      goalValue: p.challenge.target,
      goalUnit: p.challenge.unit,
      progress: p.current,
      status: p.completed ? "completed" : "active",
      endDate: p.challenge.end_date,
    }));

  return NextResponse.json(active);
}
