import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const category = url.searchParams.get("category") || "distance";
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);

  let orderColumn = "total_distance";
  let unit = "km";
  if (category === "runs") { orderColumn = "total_runs"; unit = "runs"; }
  else if (category === "elevation") { orderColumn = "total_elevation"; unit = "m"; }
  else if (category === "streak") { orderColumn = "current_streak"; unit = "days"; }
  else if (category === "xp") { orderColumn = "xp"; unit = "xp"; }

  const { data: stats, error } = await supabase
    .from("community_member_stats")
    .select(`*, profiles:user_id (id, name, username, avatar, level)`)
    .eq("club_id", id)
    .order(orderColumn, { ascending: false })
    .limit(limit);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const sorted = (stats || [])
    .map((s: any, i: number) => ({
      rank: i + 1,
      userId: s.profiles?.id,
      name: s.profiles?.name,
      username: s.profiles?.username,
      avatar: s.profiles?.avatar || "",
      value: s[orderColumn] || 0,
      unit,
      level: s.profiles?.level || 1,
      isCurrentUser: s.user_id === user.id,
    }));

  const top3 = sorted.slice(0, 3);

  return NextResponse.json({ data: sorted, top3, meta: { total: sorted.length, category } });
}
