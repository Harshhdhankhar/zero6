import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { rateLimitMiddleware } from "@/lib/rate-limit";
import { updateEventSchema, validateBody } from "@/lib/validations";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: event, error } = await supabase
    .from("events")
    .select(`
      *,
      profiles:organizer_id (id, name, avatar)
    `)
    .eq("id", id)
    .single();

  if (error || !event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isRegistered = false;
  if (user) {
    const rateCheck = rateLimitMiddleware(user.id, "event-detail", 60);
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { data: reg } = await supabase
      .from("event_registrations")
      .select("id")
      .eq("event_id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    isRegistered = !!reg;
  }

  return NextResponse.json({
    data: {
      id: event.id,
      title: event.title,
      description: event.description,
      coverImage: event.cover_image || "",
      date: event.date,
      time: event.time,
      location: event.location,
      distance: event.distance,
      type: event.type,
      registeredCount: event.registered_count,
      maxParticipants: event.max_participants,
      price: event.price,
      currency: event.currency,
      isRegistered,
      organizer: event.profiles?.name || "Unknown",
      organizerAvatar: event.profiles?.avatar || "",
      organizerId: event.profiles?.id,
      tags: event.tags || [],
      status: event.status,
    },
  });
}

export async function PATCH(
  request: Request,
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

  const rateCheck = rateLimitMiddleware(user.id, "updateEvent", 30);
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  // Check ownership
  const { data: event } = await supabase
    .from("events")
    .select("organizer_id")
    .eq("id", id)
    .single();

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  if (event.organizer_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = validateBody(updateEventSchema, body);
  if (!parsed.success) return parsed.response;

  const updates: Record<string, unknown> = {};
  if (parsed.data.title !== undefined) updates.title = parsed.data.title;
  if (parsed.data.description !== undefined) updates.description = parsed.data.description;
  if (parsed.data.status !== undefined) updates.status = parsed.data.status;
  if (parsed.data.maxParticipants !== undefined) updates.max_participants = parsed.data.maxParticipants;

  const { error } = await supabase
    .from("events")
    .update(updates)
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: { id } });
}
