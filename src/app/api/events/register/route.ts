import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";
import { registerEventSchema, validateBody } from "@/lib/validations";
import { rateLimitMiddleware } from "@/lib/rate-limit";

// POST /api/events/register — Register for event
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateCheck = rateLimitMiddleware(user.id, "registerEvent");
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await request.json();
  const parsed = validateBody(registerEventSchema, body);
  if (!parsed.success) return parsed.response;
  const eventId = parsed.data.eventId;

  const { error } = await supabase.from("event_registrations").insert({
    event_id: eventId,
    user_id: user.id,
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Already registered" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Increment registered count
  await supabase.rpc("increment_event_registered_count", { p_event_id: eventId, p_delta: 1 });

  return NextResponse.json({ message: "Registered for event" }, { status: 201 });
}

// DELETE /api/events/register — Unregister from event
export async function DELETE(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = validateBody(registerEventSchema, body);
  if (!parsed.success) return parsed.response;
  const eventId = parsed.data.eventId;

  const { error } = await supabase
    .from("event_registrations")
    .delete()
    .eq("event_id", eventId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.rpc("increment_event_registered_count", { p_event_id: eventId, p_delta: -1 });

  return NextResponse.json({ message: "Unregistered from event" });
}
