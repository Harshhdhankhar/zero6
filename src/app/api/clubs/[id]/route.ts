import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { rateLimitMiddleware } from "@/lib/rate-limit";

export async function GET(
  _request: Request,
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

  const rateCheck = rateLimitMiddleware(user.id, "club-detail", 60);
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { data: club, error } = await supabase
    .from("clubs")
    .select(`
      *,
      profiles:created_by_id (id, name, avatar)
    `)
    .eq("id", id)
    .single();

  if (error || !club) {
    return NextResponse.json({ error: "Club not found" }, { status: 404 });
  }

  let isMember = false;
  let memberRole: string | null = null;
  const { data: membership } = await supabase
    .from("club_members")
    .select("id, role")
    .eq("club_id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  isMember = !!membership;
  memberRole = membership?.role || null;

  const { data: members } = await supabase
    .from("club_members")
    .select(`
      role,
      joined_at,
      profiles:user_id (id, name, username, avatar, total_distance, current_streak)
    `)
    .eq("club_id", id)
    .order("joined_at", { ascending: true })
    .limit(20);

  return NextResponse.json({
    data: {
      id: club.id,
      name: club.name,
      description: club.description,
      avatar: club.avatar || "",
      coverImage: club.cover_image || "",
      location: club.location || "",
      city: club.city || "",
      latitude: club.latitude || null,
      longitude: club.longitude || null,
      memberCount: club.member_count,
      activityCount: club.activity_count,
      isMember,
      memberRole,
      joinType: club.join_type || "public",
      rules: club.rules || [],
      socialLinks: club.social_links || {},
      welcomeMessage: club.welcome_message || "",
      chatEnabled: club.chat_enabled ?? true,
      galleryEnabled: club.gallery_enabled ?? true,
      eventsEnabled: club.events_enabled ?? true,
      runsEnabled: club.runs_enabled ?? true,
      routesEnabled: club.routes_enabled ?? true,
      createdBy: club.created_by_id,
      createdByName: club.profiles?.name || "Unknown",
      category: club.category,
      tags: club.tags || [],
      createdAt: club.created_at,
      runningType: club.running_type || club.category || "road",
      isWomenOnly: club.is_women_only || false,
      isBeginnerFriendly: club.is_beginner_friendly || false,
      morningRuns: club.morning_runs || false,
      eveningRuns: club.evening_runs || false,
      activeMembersToday: club.active_members_today || 0,
      nextRun: club.next_run || null,
      rating: club.rating || 0,
      isVerified: club.is_verified || false,
      members: (members || []).map((m: any) => ({
        id: m.profiles?.id,
        name: m.profiles?.name,
        username: m.profiles?.username,
        avatar: m.profiles?.avatar || "",
        role: m.role,
        totalDistance: m.profiles?.total_distance,
        currentStreak: m.profiles?.current_streak,
        joinedAt: m.joined_at,
      })),
    },
  });
}
