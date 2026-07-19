import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { rateLimitMiddleware } from "@/lib/rate-limit";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const targetUserId = searchParams.get("userId");
  if (!targetUserId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const { data: callerMembership } = await supabase
    .from("club_members")
    .select("role")
    .eq("club_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!callerMembership || !["owner", "moderator"].includes(callerMembership.role)) {
    return NextResponse.json({ error: "Only owners and moderators can remove members" }, { status: 403 });
  }

  if (targetUserId === user.id) {
    return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 });
  }

  // Can't remove an owner
  const { data: targetMembership } = await supabase
    .from("club_members")
    .select("role")
    .eq("club_id", id)
    .eq("user_id", targetUserId)
    .maybeSingle();

  if (targetMembership?.role === "owner") {
    return NextResponse.json({ error: "Cannot remove the owner" }, { status: 403 });
  }

  // Moderators can't remove other moderators (only owners can)
  if (callerMembership.role === "moderator" && targetMembership?.role === "moderator") {
    return NextResponse.json({ error: "Moderators cannot remove other moderators" }, { status: 403 });
  }

  const { error } = await supabase
    .from("club_members")
    .delete()
    .eq("club_id", id)
    .eq("user_id", targetUserId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.rpc("increment_club_member_count", { p_club_id: id, p_delta: -1 });

  return NextResponse.json({ message: "Member removed" });
}

export async function GET(
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

  const rateCheck = rateLimitMiddleware(user.id, "club-members", 30);
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 50);
  const offset = parseInt(url.searchParams.get("offset") || "0");

  const { data: members, error, count } = await supabase
    .from("club_members")
    .select(
      `role, joined_at, nickname, xp_in_community, profiles:user_id (id, name, username, avatar, total_distance, current_streak, level)`,
      { count: "exact" }
    )
    .eq("club_id", id)
    .order("joined_at", { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data: (members || []).map((m: any) => ({
      id: m.profiles?.id,
      name: m.profiles?.name,
      username: m.profiles?.username,
      avatar: m.profiles?.avatar || "",
      role: m.role,
      nickname: m.nickname || "",
      xpInCommunity: m.xp_in_community || 0,
      totalDistance: m.profiles?.total_distance,
      currentStreak: m.profiles?.current_streak,
      level: m.profiles?.level || 1,
      joinedAt: m.joined_at,
    })),
    meta: { total: count || 0, limit, offset },
  });
}
