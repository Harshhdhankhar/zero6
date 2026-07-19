import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { createClubSchema, validateBody } from "@/lib/validations";
import { rateLimitMiddleware } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);
  const offset = parseInt(url.searchParams.get("offset") || "0");

  const { data: clubs, error, count } = await supabase
    .from("clubs")
    .select(`*, profiles:created_by_id (id, name, avatar)`, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let memberships: string[] = [];
  if (user) {
    const { data: memberData } = await supabase
      .from("club_members")
      .select("club_id")
      .eq("user_id", user.id);
    memberships = (memberData || []).map((m: any) => m.club_id);
  }

  const formatted = (clubs || []).map((c: any) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    avatar: c.avatar || "",
    coverImage: c.cover_image || "",
    location: c.location || "",
    city: c.city || "",
    latitude: c.latitude || null,
    longitude: c.longitude || null,
    memberCount: c.member_count,
    activityCount: c.activity_count,
    isJoined: memberships.includes(c.id),
    createdBy: c.created_by_id,
    category: c.category,
    tags: c.tags || [],
    createdAt: c.created_at,
    runningType: c.running_type || c.category || "road",
    isWomenOnly: c.is_women_only || false,
    isBeginnerFriendly: c.is_beginner_friendly || false,
    morningRuns: c.morning_runs || false,
    eveningRuns: c.evening_runs || false,
    activeMembersToday: c.active_members_today || 0,
    nextRun: c.next_run || null,
    rating: c.rating || 0,
    isVerified: c.is_verified || false,
    joinType: c.join_type || "public",
  }));

  return NextResponse.json({
    data: formatted,
    meta: { total: count || 0, limit, offset },
  });
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateCheck = rateLimitMiddleware(user.id, "createClub");
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await request.json();
  const parsed = validateBody(createClubSchema, body);
  if (!parsed.success) return parsed.response;

  // Insert club and auto-join creator in a transaction
  const { data: club, error: clubError } = await supabase
    .from("clubs")
    .insert({
      name: parsed.data.name,
      description: parsed.data.description || "",
      location: parsed.data.location || "",
      category: parsed.data.category,
      tags: body.tags || [],
      avatar: body.avatar || "",
      cover_image: body.coverImage || body.cover_image || "",
      created_by_id: user.id,
      member_count: 1,
    })
    .select()
    .single();

  if (clubError) {
    return NextResponse.json({ error: clubError.message }, { status: 500 });
  }

  // Auto-join creator as owner
  const { error: memberError } = await supabase.from("club_members").insert({
    club_id: club.id,
    user_id: user.id,
    role: "owner",
  });

  if (memberError) {
    // Rollback: delete the club if membership insert fails
    await supabase.from("clubs").delete().eq("id", club.id);
    return NextResponse.json({ error: memberError.message }, { status: 500 });
  }

  // Create default chat channels and community settings
  await supabase.rpc("create_default_chat_channels", {
    p_club_id: club.id,
    p_creator_id: user.id,
  });
  await supabase.rpc("create_community_settings", { p_club_id: club.id });

  return NextResponse.json({
    data: {
      id: club.id,
      name: club.name,
      description: club.description,
      avatar: club.avatar || "",
      coverImage: club.cover_image || "",
      location: club.location || "",
      category: club.category,
      memberCount: club.member_count,
      createdBy: club.created_by_id,
      createdAt: club.created_at,
      joinType: club.join_type || "public",
    },
  }, { status: 201 });
}
