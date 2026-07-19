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

  const { data: routes, error } = await supabase
    .from("community_routes")
    .select(`*, profiles:created_by (id, name, avatar)`)
    .eq("club_id", id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const formatted = (routes || []).map((r: any) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    distance: r.distance,
    elevationGain: r.elevation_gain,
    difficulty: r.difficulty,
    location: r.location,
    city: r.city,
    coordinates: r.coordinates,
    imageUrl: r.image_url,
    timesCompleted: r.times_completed || 0,
    bestTime: r.best_time,
    isFeatured: r.is_featured,
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

  if (!membership) {
    return NextResponse.json({ error: "Must be a member" }, { status: 403 });
  }

  const body = await request.json();
  const { title, description, distance, elevationGain, difficulty, location, city, coordinates, imageUrl } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: "Route title is required" }, { status: 400 });
  }

  if (!distance || distance <= 0) {
    return NextResponse.json({ error: "Valid distance is required" }, { status: 400 });
  }

  const { data: route, error } = await supabase
    .from("community_routes")
    .insert({
      club_id: id,
      created_by: user.id,
      title: title.trim(),
      description: description || "",
      distance,
      elevation_gain: elevationGain || 0,
      difficulty: difficulty || "easy",
      location: location || "",
      city: city || "",
      coordinates: coordinates || "[]",
      image_url: imageUrl || "",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    data: {
      id: route.id,
      title: route.title,
      distance: route.distance,
      difficulty: route.difficulty,
      location: route.location,
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
  const { routeId, title, description, distance, elevationGain, difficulty, location, city, coordinates, imageUrl, isFeatured } = body;

  if (!routeId) {
    return NextResponse.json({ error: "routeId is required" }, { status: 400 });
  }

  const { data: route } = await supabase
    .from("community_routes")
    .select("created_by")
    .eq("id", routeId)
    .eq("club_id", id)
    .single();

  if (!route) return NextResponse.json({ error: "Route not found" }, { status: 404 });

  const { data: membership } = await supabase
    .from("club_members")
    .select("role")
    .eq("club_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  const isCreator = route.created_by === user.id;
  const isAdmin = membership && ["owner", "moderator"].includes(membership.role);

  if (!isCreator && !isAdmin) {
    return NextResponse.json({ error: "Only route creator or admins can update" }, { status: 403 });
  }

  const updates: Record<string, any> = {};
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (distance !== undefined) updates.distance = distance;
  if (elevationGain !== undefined) updates.elevation_gain = elevationGain;
  if (difficulty !== undefined) updates.difficulty = difficulty;
  if (location !== undefined) updates.location = location;
  if (city !== undefined) updates.city = city;
  if (coordinates !== undefined) updates.coordinates = coordinates;
  if (imageUrl !== undefined) updates.image_url = imageUrl;
  if (isFeatured !== undefined) updates.is_featured = isFeatured;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { error } = await supabase
    .from("community_routes")
    .update(updates)
    .eq("id", routeId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: "Route updated" });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const routeId = searchParams.get("routeId");

  if (!routeId) {
    return NextResponse.json({ error: "routeId query param is required" }, { status: 400 });
  }

  const { data: route } = await supabase
    .from("community_routes")
    .select("created_by")
    .eq("id", routeId)
    .eq("club_id", id)
    .single();

  if (!route) return NextResponse.json({ error: "Route not found" }, { status: 404 });

  const { data: membership } = await supabase
    .from("club_members")
    .select("role")
    .eq("club_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  const isCreator = route.created_by === user.id;
  const isAdmin = membership && ["owner", "moderator"].includes(membership.role);

  if (!isCreator && !isAdmin) {
    return NextResponse.json({ error: "Only route creator or admins can delete" }, { status: 403 });
  }

  const { error } = await supabase
    .from("community_routes")
    .delete()
    .eq("id", routeId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: "Route deleted" });
}
