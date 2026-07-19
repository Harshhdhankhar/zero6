import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { validateBody } from "@/lib/validations";
import { rateLimitMiddleware } from "@/lib/rate-limit";

const addPhotoSchema = z.object({
  url: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  caption: z.string().max(200).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const rateCheck = rateLimitMiddleware(user?.id || "anon", "list-photos", 60);
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { data: photos, error } = await supabase
    .from("route_photos")
    .select("*")
    .eq("route_id", id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const formatted = (photos || []).map((p: any) => ({
    id: p.id,
    routeId: p.route_id,
    userId: p.user_id,
    url: p.url,
    thumbnailUrl: p.thumbnail_url,
    caption: p.caption,
    latitude: p.latitude,
    longitude: p.longitude,
    isCover: p.is_cover,
    createdAt: p.created_at,
  }));

  return NextResponse.json({ data: formatted });
}

export async function POST(
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

  const rateCheck = rateLimitMiddleware(user.id, "add-photo", 20);
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await request.json();
  const parsed = validateBody(addPhotoSchema, body);
  if (!parsed.success) return parsed.response;

  const { data: photo, error } = await supabase
    .from("route_photos")
    .insert({
      route_id: id,
      user_id: user.id,
      url: parsed.data.url,
      thumbnail_url: parsed.data.thumbnailUrl || null,
      caption: parsed.data.caption || null,
      latitude: parsed.data.latitude || null,
      longitude: parsed.data.longitude || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: photo }, { status: 201 });
}
