import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

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

  if (!membership) {
    return NextResponse.json({ error: "Must be a member" }, { status: 403 });
  }

  const body = await request.json();
  const { runId } = body;

  if (!runId) {
    return NextResponse.json({ error: "runId is required" }, { status: 400 });
  }

  const { data: run } = await supabase
    .from("community_runs")
    .select("id, max_participants, registered_count, status")
    .eq("id", runId)
    .eq("club_id", id)
    .single();

  if (!run) return NextResponse.json({ error: "Run not found" }, { status: 404 });
  if (run.status !== "upcoming") return NextResponse.json({ error: "Can only register for upcoming runs" }, { status: 400 });

  const { data: existing } = await supabase
    .from("community_run_registrations")
    .select("id")
    .eq("run_id", runId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) return NextResponse.json({ error: "Already registered" }, { status: 409 });

  if (run.registered_count >= run.max_participants) {
    return NextResponse.json({ error: "Run is full" }, { status: 400 });
  }

  const { error: regError } = await supabase
    .from("community_run_registrations")
    .insert({ run_id: runId, user_id: user.id });

  if (regError) return NextResponse.json({ error: regError.message }, { status: 500 });

  await supabase.rpc("increment_community_run_count", { p_run_id: runId, p_delta: 1 });

  return NextResponse.json({ message: "Registered for run" }, { status: 201 });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { runId } = body;

  if (!runId) {
    return NextResponse.json({ error: "runId is required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("community_run_registrations")
    .delete()
    .eq("run_id", runId)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.rpc("increment_community_run_count", { p_run_id: runId, p_delta: -1 });

  return NextResponse.json({ message: "Unregistered from run" });
}
