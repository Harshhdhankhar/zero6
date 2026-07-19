import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { validateBody } from "@/lib/validations";
import { rateLimitMiddleware } from "@/lib/rate-limit";

const createCollectionSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  type: z.enum(["favorites", "weekend", "training", "hill", "distance", "time_of_day", "custom"]).optional(),
  distanceCategory: z.enum(["5k", "10k", "half_marathon", "marathon", "ultra", "any"]).optional(),
  isPublic: z.boolean().optional(),
});

export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: collections, error } = await supabase
      .from("route_collections")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const formatted = (collections || []).map((c: any) => ({
      id: c.id,
      userId: c.user_id,
      title: c.title,
      description: c.description,
      coverPhotoUrl: c.cover_photo_url,
      isPublic: c.is_public,
      type: c.type,
      distanceCategory: c.distance_category,
      createdAt: c.created_at,
      routeCount: 0,
    }));

    return NextResponse.json({ data: formatted });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateCheck = rateLimitMiddleware(user.id, "create-collection", 20);
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await request.json();
  const parsed = validateBody(createCollectionSchema, body);
  if (!parsed.success) return parsed.response;

  const { data: collection, error } = await supabase
    .from("route_collections")
    .insert({
      user_id: user.id,
      title: parsed.data.title,
      description: parsed.data.description || null,
      type: parsed.data.type || "custom",
      distance_category: parsed.data.distanceCategory || "any",
      is_public: parsed.data.isPublic ?? true,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: collection }, { status: 201 });
}
