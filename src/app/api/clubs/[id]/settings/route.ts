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

  const { data: membership } = await supabase
    .from("club_members")
    .select("role")
    .eq("club_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: "Must be a member" }, { status: 403 });
  }

  const { data: settings, error } = await supabase
    .from("community_settings")
    .select("*")
    .eq("club_id", id)
    .single();

  if (error || !settings) {
    return NextResponse.json({ data: null });
  }

  return NextResponse.json({
    data: {
      clubId: settings.club_id,
      defaultChannelId: settings.default_channel_id,
      welcomeMessage: settings.welcome_message,
      autoApproveMembers: settings.auto_approve_members,
      allowMemberPosts: settings.allow_member_posts,
      allowMemberEvents: settings.allow_member_events,
      allowMemberChallenges: settings.allow_member_challenges,
      requirePostApproval: settings.require_post_approval,
      mutedUntil: settings.muted_until,
    },
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: membership } = await supabase
    .from("club_members")
    .select("role")
    .eq("club_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership || membership.role !== "owner") {
    return NextResponse.json({ error: "Only the owner can update community settings" }, { status: 403 });
  }

  const body = await request.json();
  const {
    defaultChannelId,
    welcomeMessage,
    autoApproveMembers,
    allowMemberPosts,
    allowMemberEvents,
    allowMemberChallenges,
    requirePostApproval,
  } = body;

  const updates: Record<string, any> = {};
  if (defaultChannelId !== undefined) updates.default_channel_id = defaultChannelId;
  if (welcomeMessage !== undefined) updates.welcome_message = welcomeMessage;
  if (autoApproveMembers !== undefined) updates.auto_approve_members = autoApproveMembers;
  if (allowMemberPosts !== undefined) updates.allow_member_posts = allowMemberPosts;
  if (allowMemberEvents !== undefined) updates.allow_member_events = allowMemberEvents;
  if (allowMemberChallenges !== undefined) updates.allow_member_challenges = allowMemberChallenges;
  if (requirePostApproval !== undefined) updates.require_post_approval = requirePostApproval;

  updates.updated_at = new Date().toISOString();

  if (Object.keys(updates).length <= 1) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { error } = await supabase
    .from("community_settings")
    .update(updates)
    .eq("club_id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: "Settings updated" });
}
