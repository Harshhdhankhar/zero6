import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";
import { joinClubSchema, validateBody } from "@/lib/validations";
import { rateLimitMiddleware } from "@/lib/rate-limit";

async function isClubPublic(supabase: any, clubId: string): Promise<boolean> {
  const { data: club } = await supabase
    .from("clubs")
    .select("join_type")
    .eq("id", clubId)
    .single();
  return club?.join_type !== "private";
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateCheck = rateLimitMiddleware(user.id, "joinClub");
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await request.json();
  const parsed = validateBody(joinClubSchema, body);
  if (!parsed.success) return parsed.response;
  const clubId = parsed.data.clubId;

  const isPublic = await isClubPublic(supabase, clubId);

  // If private, create a join request instead
  if (!isPublic) {
    const { error: reqError } = await supabase.from("club_join_requests").upsert(
      { club_id: clubId, user_id: user.id, status: "pending" },
      { onConflict: "club_id,user_id", ignoreDuplicates: true }
    );
    if (reqError) {
      if (reqError.code === "23505") {
        return NextResponse.json({ error: "Already requested" }, { status: 409 });
      }
      return NextResponse.json({ error: reqError.message }, { status: 500 });
    }

    // Notify owners
    const { data: owners } = await supabase
      .from("club_members")
      .select("user_id")
      .eq("club_id", clubId)
      .in("role", ["owner", "moderator"]);
    for (const owner of owners || []) {
      await supabase.rpc("create_community_notification", {
        p_club_id: clubId,
        p_user_id: owner.user_id,
        p_type: "join_request",
        p_title: "New join request",
        p_body: `${user.email || "A user"} wants to join`,
        p_data: JSON.stringify({ userId: user.id, requestId: clubId }),
      });
    }

    return NextResponse.json({ message: "Request sent", joinType: "private" });
  }

  // Public: join immediately
  const { error } = await supabase.from("club_members").insert({
    club_id: clubId,
    user_id: user.id,
    role: "member",
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Already a member" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.rpc("increment_club_member_count", { p_club_id: clubId, p_delta: 1 });

  // Notify owners of new member
  const { data: owners } = await supabase
    .from("club_members")
    .select("user_id")
    .eq("club_id", clubId)
    .in("role", ["owner", "moderator"]);
  for (const owner of owners || []) {
    if (owner.user_id === user.id) continue;
    await supabase.rpc("create_community_notification", {
      p_club_id: clubId,
      p_user_id: owner.user_id,
      p_type: "join",
      p_title: "New member joined",
      p_body: `${user.email || "A user"} joined the community`,
      p_data: JSON.stringify({ userId: user.id }),
    });
  }

  return NextResponse.json({ message: "Joined club" }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateCheck = rateLimitMiddleware(user.id, "leaveClub");
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await request.json();
  const parsed = validateBody(joinClubSchema, body);
  if (!parsed.success) return parsed.response;
  const clubId = parsed.data.clubId;

  // Prevent owner from leaving
  const { data: membership } = await supabase
    .from("club_members")
    .select("role")
    .eq("club_id", clubId)
    .eq("user_id", user.id)
    .single();

  if (membership?.role === "owner") {
    return NextResponse.json({ error: "Owner cannot leave. Transfer ownership or delete the community first." }, { status: 400 });
  }

  const { error } = await supabase
    .from("club_members")
    .delete()
    .eq("club_id", clubId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.rpc("increment_club_member_count", { p_club_id: clubId, p_delta: -1 });

  return NextResponse.json({ message: "Left club" });
}
