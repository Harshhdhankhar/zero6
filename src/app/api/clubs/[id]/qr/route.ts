import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const eventId = url.searchParams.get("eventId");

  let query = supabase.from("qr_codes").select(`*, events!inner(title, date)`)
    .eq("user_id", user.id);
  if (eventId) query = query.eq("event_id", eventId);

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data: data || [] });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { eventId } = body;
  if (!eventId) return NextResponse.json({ error: "eventId required" }, { status: 400 });

  const existing = await supabase.from("qr_codes")
    .select("id").eq("event_id", eventId).eq("user_id", user.id).maybeSingle();
  if (existing.data) return NextResponse.json({ data: existing.data });

  const code = crypto.randomBytes(16).toString("hex");
  const { data, error } = await supabase.from("qr_codes").insert({
    event_id: eventId, user_id: user.id, code,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
