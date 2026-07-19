import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { rateLimitMiddleware } from "@/lib/rate-limit";

export async function GET(
  _request: Request,
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

  const rateCheck = rateLimitMiddleware(user.id, "participants", 30);
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { data: registrations, error } = await supabase
    .from("event_registrations")
    .select(`
      user_id,
      created_at,
      profiles:user_id (id, name, avatar)
    `)
    .eq("event_id", id)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const data = (registrations || []).map((r: any) => ({
    userId: r.user_id,
    name: r.profiles?.name || "Unknown",
    avatar: r.profiles?.avatar || "",
    registeredAt: r.created_at,
  }));

  return NextResponse.json({ data });
}
