import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { rateLimitMiddleware } from "@/lib/rate-limit";

export async function GET() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const rateCheck = rateLimitMiddleware(user?.id || "anon", "list-galleries", 60);
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { data: galleries, error } = await supabase
    .from("city_galleries")
    .select("*")
    .order("city", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const formatted = (galleries || []).map((g: any) => ({
    id: g.id,
    city: g.city,
    state: g.state,
    coverPhotoUrl: g.cover_photo_url,
    totalRoutes: g.total_routes,
    totalPhotos: g.total_photos,
    totalRunners: g.total_runners,
    activeClubs: g.active_clubs,
    upcomingEvents: g.upcoming_events,
  }));

  return NextResponse.json({
    data: formatted,
    meta: { total: formatted.length },
  });
}
