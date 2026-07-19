import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { rateLimitMiddleware } from "@/lib/rate-limit";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: collection, error } = await supabase
    .from("route_collections")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !collection) {
    return NextResponse.json({ error: "Collection not found" }, { status: 404 });
  }

  const isOwner = user?.id === collection.user_id;
  if (!collection.is_public && !isOwner) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: items, error: itemsError } = await supabase
    .from("route_collection_items")
    .select(`
      *,
      activity:activity_id (
        *,
        user:user_id (id, name, username, avatar)
      )
    `)
    .eq("collection_id", id)
    .order("added_at", { ascending: true });

  if (itemsError) {
    return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }

  const formattedItems = (items || []).map((item: any) => {
    const a = item.activity;
    return {
      id: item.id,
      collectionId: item.collection_id,
      routeId: item.activity_id,
      notes: item.notes,
      sortOrder: item.sort_order,
      route: a ? {
        id: a.id,
        userId: a.user_id,
        title: a.title,
        description: a.description,
        distance: a.distance,
        duration: a.duration,
        pace: a.pace,
        elevationGain: a.elevation_gain,
        type: a.type,
        route: a.route,
        createdAt: a.created_at,
        creator: a.user,
      } : null,
    };
  });

  return NextResponse.json({
    data: {
      id: collection.id,
      userId: collection.user_id,
      title: collection.title,
      description: collection.description,
      coverPhotoUrl: collection.cover_photo_url,
      isPublic: collection.is_public,
      type: collection.type,
      distanceCategory: collection.distance_category,
      createdAt: collection.created_at,
      items: formattedItems,
    },
  });
}

export async function PUT(
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

  const { data: existing } = await supabase
    .from("route_collections")
    .select("user_id")
    .eq("id", id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (existing.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const updateData: Record<string, unknown> = {};
  if (body.title !== undefined) updateData.title = body.title;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.isPublic !== undefined) updateData.is_public = body.isPublic;
  if (body.type !== undefined) updateData.type = body.type;
  if (body.distanceCategory !== undefined) updateData.distance_category = body.distanceCategory;

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { error } = await supabase
    .from("route_collections")
    .update(updateData)
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: { id } });
}

export async function DELETE(
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

  const { data: existing } = await supabase
    .from("route_collections")
    .select("user_id")
    .eq("id", id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (existing.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabase.from("route_collections").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: { id } });
}
