import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { createEventSchema, validateBody } from "@/lib/validations";
import { rateLimitMiddleware } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status");

  let query = supabase
    .from("events")
    .select(`
      *,
      profiles:organizer_id (id, name, avatar)
    `)
    .order("date", { ascending: true });

  if (statusFilter) {
    const statuses = statusFilter.split(",");
    query = query.in("status", statuses);
  }

  const { data: events, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Check current user registrations
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let registrations: string[] = [];
  if (user) {
    const { data: regData } = await supabase
      .from("event_registrations")
      .select("event_id")
      .eq("user_id", user.id);
    registrations = (regData || []).map((r: any) => r.event_id);
  }

  const formatted = (events || []).map((e: any) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    coverImage: e.cover_image || "",
    date: e.date,
    time: e.time,
    location: e.location,
    latitude: e.latitude || null,
    longitude: e.longitude || null,
    distance: e.distance,
    type: e.type,
    registeredCount: e.registered_count,
    maxParticipants: e.max_participants,
    price: e.price,
    currency: e.currency,
    isRegistered: registrations.includes(e.id),
    organizer: e.profiles?.name || "Unknown",
    organizerAvatar: e.profiles?.avatar || "",
    tags: e.tags || [],
    status: e.status,
  }));

  return NextResponse.json({
    data: formatted,
    meta: { total: formatted.length },
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

  const rateCheck = rateLimitMiddleware(user.id, "createEvent");
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await request.json();
  const parsed = validateBody(createEventSchema, body);
  if (!parsed.success) return parsed.response;

  const { data: event, error } = await supabase
    .from("events")
    .insert({
      title: parsed.data.title,
      description: parsed.data.description || "",
      cover_image: body.coverImage || "",
      date: parsed.data.date,
      time: parsed.data.time,
      location: parsed.data.location,
      distance: parsed.data.distance,
      type: parsed.data.type,
      max_participants: parsed.data.maxParticipants || 100,
      price: parsed.data.price || 0,
      currency: body.currency || "USD",
      tags: body.tags || [],
      organizer_id: user.id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: event }, { status: 201 });
}
