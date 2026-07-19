import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = await supabase.from("club_members")
    .select("role").eq("club_id", id).eq("user_id", user.id).maybeSingle();
  if (!isAdmin.data || (isAdmin.data as any).role !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [clubRes, membersRes, feedRes, eventsRes, challengesRes] = await Promise.all([
    supabase.from("clubs").select("member_count, activity_count, created_at").eq("id", id).single(),
    supabase.from("club_members").select("id, joined_at, role", { count: "exact" }).eq("club_id", id),
    supabase.from("community_feed").select("id, created_at").eq("club_id", id),
    supabase.from("events").select("id, date, registered_count").eq("club_id", id),
    supabase.from("community_challenges").select("id, participants_count").eq("club_id", id),
  ]);

  const totalMembers = membersRes.count || 0;
  const totalPosts = feedRes.data?.length || 0;
  const totalEvents = eventsRes.data?.length || 0;
  const totalChallenges = challengesRes.data?.length || 0;
  const activeMembers = membersRes.data?.filter((m: any) => {
    const daysSinceJoin = Math.floor((Date.now() - new Date(m.joined_at).getTime()) / 86400000);
    return daysSinceJoin < 30;
  }).length || 0;

  // Calculate monthly registrations from member join dates
  const monthlyRegistrations = (() => {
    const months = new Map<string, number>();
    for (const m of membersRes.data || []) {
      const d = new Date(m.joined_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      months.set(key, (months.get(key) || 0) + 1);
    }
    // Last 6 months
    const result = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      result.push({
        month: d.toLocaleString("default", { month: "short" }),
        count: months.get(key) || 0,
      });
    }
    return result;
  })();

  // Fetch total distance from profiles of members
  const { data: memberProfiles } = await supabase
    .from("club_members")
    .select(`profiles:user_id (total_distance)`)
    .eq("club_id", id);
  const totalDistance = memberProfiles?.reduce((sum: number, m: any) => sum + (m.profiles?.total_distance || 0), 0) || 0;
  const avgWeeklyDistance = totalMembers > 0 ? ((totalDistance / totalMembers) / 4) : 0;

  return NextResponse.json({
    data: {
      totalMembers, activeMembers, totalPosts, totalEvents, totalChallenges,
      avgPace: 0, avgWeeklyDistance, monthlyRegistrations,
    },
  });
}
