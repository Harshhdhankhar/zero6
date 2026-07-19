import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { rateLimitMiddleware } from "@/lib/rate-limit";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: collectionId } = await params;
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: collection } = await supabase
    .from("route_collections")
    .select("user_id")
    .eq("id", collectionId)
    .single();

  if (!collection) {
    return NextResponse.json({ error: "Collection not found" }, { status: 404 });
  }
  if (collection.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { routeId, notes } = body;

  if (!routeId) {
    return NextResponse.json({ error: "routeId is required" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("route_collection_items")
    .select("id")
    .eq("collection_id", collectionId)
    .eq("route_id", routeId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "Route already in collection" }, { status: 409 });
  }

  const { data: maxOrder } = await supabase
    .from("route_collection_items")
    .select("sort_order")
    .eq("collection_id", collectionId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrder = (maxOrder?.sort_order ?? -1) + 1;

  const { data: item, error } = await supabase
    .from("route_collection_items")
    .insert({
      collection_id: collectionId,
      route_id: routeId,
      notes: notes || null,
      sort_order: nextOrder,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: item }, { status: 201 });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: collectionId } = await params;
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: collection } = await supabase
    .from("route_collections")
    .select("user_id")
    .eq("id", collectionId)
    .single();

  if (!collection) {
    return NextResponse.json({ error: "Collection not found" }, { status: 404 });
  }
  if (collection.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { routeId } = body;

  if (!routeId) {
    return NextResponse.json({ error: "routeId is required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("route_collection_items")
    .delete()
    .eq("collection_id", collectionId)
    .eq("route_id", routeId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: { success: true } });
}
