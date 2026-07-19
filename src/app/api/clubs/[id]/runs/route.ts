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

  const { data: membership } = await supabase
    .from("club_members")
    .select("role")
    .eq("club_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: "Must be a member" }, { status: 403 });
  }

  const url = new URL(request.url);
  const status = url.searchParams.get("status") || "upcoming";

  const { data: runs, error } = await supabase
    .from("community_runs")
    .select(`
      *, profiles:created_by (id, name, avatar),
      community_routes!community_runs_route_id_fkey (id, title, distance, difficulty)
    `)
    .eq("club_id", id)
    .eq("status", status)
    .order("scheduled_at", { ascending: status === "upcoming" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const runIds = (runs || []).map((r: any) => r.id);
  let userRegistrations: string[] = [];

  if (runIds.length > 0) {
    const { data: regs } = await supabase
      .from("community_run_registrations")
      .select("run_id")
      .eq("user_id", user.id)
      .in("run_id", runIds);
    userRegistrations = (regs || []).map((r: any) => r.run_id);
  }

  const formatted = (runs || []).map((r: any) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    scheduledAt: r.scheduled_at,
    meetingPoint: r.meeting_point,
    distance: r.distance,
    paceGroup: r.pace_group,
    maxParticipants: r.max_participants,
    registeredCount: r.registered_count || 0,
    status: r.status,
    weatherNotes: r.weather_notes,
    isRegistered: userRegistrations.includes(r.id),
    route: r.community_routes ? {
      id: r.community_routes.id,
      title: r.community_routes.title,
      distance: r.community_routes.distance,
      difficulty: r.community_routes.difficulty,
    } : null,
    createdBy: r.profiles ? { id: r.profiles.id, name: r.profiles.name, avatar: r.profiles.avatar } : null,
    createdAt: r.created_at,
  }));

  return NextResponse.json({ data: formatted });
}

export async function POST(
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

  if (!membership || !["owner", "moderator"].includes(membership.role)) {
    return NextResponse.json({ error: "Only owners and moderators can create runs" }, { status: 403 });
  }

  const body = await request.json();
  const { title, description, scheduledAt, meetingPoint, distance, paceGroup, maxParticipants, routeId } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: "Run title is required" }, { status: 400 });
  }

  if (!scheduledAt) {
    return NextResponse.json({ error: "Schedule date/time is required" }, { status: 400 });
  }

  const { data: run, error } = await supabase
    .from("community_runs")
    .insert({
      club_id: id,
      created_by: user.id,
      route_id: routeId || null,
      title: title.trim(),
      description: description || "",
      scheduled_at: scheduledAt,
      meeting_point: meetingPoint || "",
      distance: distance || null,
      pace_group: paceGroup || "",
      max_participants: maxParticipants || 50,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    data: {
      id: run.id,
      title: run.title,
      scheduledAt: run.scheduled_at,
      status: run.status,
    },
  }, { status: 201 });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { runId, title, description, scheduledAt, meetingPoint, distance, paceGroup, maxParticipants, status } = body;

  if (!runId) {
    return NextResponse.json({ error: "runId is required" }, { status: 400 });
  }

  const { data: run } = await supabase
    .from("community_runs")
    .select("created_by")
    .eq("id", runId)
    .eq("club_id", id)
    .single();

  if (!run) return NextResponse.json({ error: "Run not found" }, { status: 404 });

  const { data: membership } = await supabase
    .from("club_members")
    .select("role")
    .eq("club_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  const isCreator = run.created_by === user.id;
  const isAdmin = membership && ["owner", "moderator"].includes(membership.role);

  if (!isCreator && !isAdmin) {
    return NextResponse.json({ error: "Only run creator or admins can update" }, { status: 403 });
  }

  const updates: Record<string, any> = {};
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (scheduledAt !== undefined) updates.scheduled_at = scheduledAt;
  if (meetingPoint !== undefined) updates.meeting_point = meetingPoint;
  if (distance !== undefined) updates.distance = distance;
  if (paceGroup !== undefined) updates.pace_group = paceGroup;
  if (maxParticipants !== undefined) updates.max_participants = maxParticipants;
  if (status !== undefined) updates.status = status;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { error } = await supabase
    .from("community_runs")
    .update(updates)
    .eq("id", runId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: "Run updated" });
}
