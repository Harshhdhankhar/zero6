export async function checkPermission(
  supabase: any,
  userId: string,
  action: string,
  params: Record<string, unknown>
): Promise<{ allowed: boolean; reason?: string }> {
  if (action === "send_message") {
    return { allowed: true };
  }

  if (action === "create_community") {
    return { allowed: true };
  }

  if (action === "delete_community") {
    const communityId = params.communityId as string;
    if (!communityId) return { allowed: false, reason: "Community ID required" };
    const { data } = await supabase
      .from("club_members")
      .select("role")
      .eq("club_id", communityId)
      .eq("user_id", userId)
      .single();
    if (!data || (data.role !== "owner" && data.role !== "admin")) {
      return { allowed: false, reason: "Only community owners can delete communities" };
    }
    return { allowed: true };
  }

  if (action === "invite_member" || action === "approve_member" || action === "reject_request") {
    const communityId = params.communityId as string;
    if (!communityId) return { allowed: false, reason: "Community ID required" };
    const { data } = await supabase
      .from("club_members")
      .select("role")
      .eq("club_id", communityId)
      .eq("user_id", userId)
      .single();
    if (!data || (data.role !== "owner" && data.role !== "moderator")) {
      return { allowed: false, reason: "Only owners and moderators can manage members" };
    }
    return { allowed: true };
  }

  if (action === "create_event") {
    return { allowed: true };
  }

  if (action === "register_for_event") {
    return { allowed: true };
  }

  if (action === "join_challenge") {
    return { allowed: true };
  }

  if (action === "leave_challenge") {
    const challengeId = params.challengeId as string;
    if (!challengeId) return { allowed: false, reason: "Challenge ID required" };
    const { data } = await supabase
      .from("challenge_participants")
      .select("id")
      .eq("challenge_id", challengeId)
      .eq("user_id", userId)
      .single();
    if (!data) return { allowed: false, reason: "You haven't joined this challenge" };
    return { allowed: true };
  }

  if (action === "update_goal") {
    return { allowed: true };
  }

  if (action === "bookmark_route") {
    return { allowed: true };
  }

  if (action === "start_run" || action === "end_run") {
    return { allowed: true };
  }

  return { allowed: false, reason: `Unknown action: ${action}` };
}
