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

  // Only owners and moderators can view requests
  const { data: membership } = await supabase
    .from("club_members")
    .select("role")
    .eq("club_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership || !["owner", "moderator"].includes(membership.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: requests, error } = await supabase
    .from("club_join_requests")
    .select(`*, profiles:user_id (id, name, username, avatar)`)
    .eq("club_id", id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    data: (requests || []).map((r: any) => ({
      id: r.id,
      userId: r.user_id,
      name: r.profiles?.name,
      username: r.profiles?.username,
      avatar: r.profiles?.avatar || "",
      status: r.status,
      createdAt: r.created_at,
    })),
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Only owners and moderators can approve/reject
  const { data: membership } = await supabase
    .from("club_members")
    .select("role")
    .eq("club_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership || !["owner", "moderator"].includes(membership.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { requestId, action } = body; // action: "approve" | "reject"

  if (!requestId || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "requestId and action (approve/reject) required" }, { status: 400 });
  }

  // Get the request
  const { data: joinRequest, error: fetchError } = await supabase
    .from("club_join_requests")
    .select("*")
    .eq("id", requestId)
    .eq("club_id", id)
    .single();

  if (fetchError || !joinRequest) {
    return NextResponse.json({ error: "Join request not found" }, { status: 404 });
  }

  if (joinRequest.status !== "pending") {
    return NextResponse.json({ error: "Request already processed" }, { status: 400 });
  }

  if (action === "approve") {
    // Insert member
    const { error: memberError } = await supabase.from("club_members").insert({
      club_id: id,
      user_id: joinRequest.user_id,
      role: "member",
    });

    if (memberError) {
      if (memberError.code === "23505") {
        return NextResponse.json({ error: "User is already a member" }, { status: 409 });
      }
      return NextResponse.json({ error: memberError.message }, { status: 500 });
    }

    await supabase.rpc("increment_club_member_count", { p_club_id: id, p_delta: 1 });

    // Notify user
    await supabase.rpc("create_community_notification", {
      p_club_id: id,
      p_user_id: joinRequest.user_id,
      p_type: "join_accepted",
      p_title: "Join request accepted",
      p_body: "Your request to join has been approved",
      p_data: JSON.stringify({ clubId: id }),
    });
  }

  // Update request status
  const { error: updateError } = await supabase
    .from("club_join_requests")
    .update({ status: action === "approve" ? "approved" : "rejected" })
    .eq("id", requestId);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({
    message: action === "approve" ? "Request approved" : "Request rejected",
    action,
  });
}
