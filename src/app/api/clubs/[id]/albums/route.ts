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

  const { data: albums, error } = await supabase
    .from("community_albums")
    .select(`*, profiles:created_by (id, name, avatar)`)
    .eq("club_id", id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const formatted = (albums || []).map((a: any) => ({
    id: a.id,
    title: a.title,
    description: a.description,
    coverUrl: a.cover_url,
    photoCount: a.photo_count || 0,
    createdBy: a.profiles ? { id: a.profiles.id, name: a.profiles.name, avatar: a.profiles.avatar } : null,
    createdAt: a.created_at,
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
  const { title, description, coverUrl } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: "Album title is required" }, { status: 400 });
  }

  const { data: album, error } = await supabase
    .from("community_albums")
    .insert({
      club_id: id,
      created_by: user.id,
      title: title.trim(),
      description: description || "",
      cover_url: coverUrl || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    data: {
      id: album.id,
      title: album.title,
      description: album.description,
      coverUrl: album.cover_url,
      photoCount: 0,
      createdAt: album.created_at,
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
  const { albumId, title, description, coverUrl } = body;

  if (!albumId) {
    return NextResponse.json({ error: "albumId is required" }, { status: 400 });
  }

  const { data: album } = await supabase
    .from("community_albums")
    .select("created_by")
    .eq("id", albumId)
    .eq("club_id", id)
    .single();

  if (!album) return NextResponse.json({ error: "Album not found" }, { status: 404 });

  const { data: membership } = await supabase
    .from("club_members")
    .select("role")
    .eq("club_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  const isOwner = album.created_by === user.id;
  const isAdmin = membership && ["owner", "moderator"].includes(membership.role);

  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Only album owner or admins can update" }, { status: 403 });
  }

  const updates: Record<string, any> = {};
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (coverUrl !== undefined) updates.cover_url = coverUrl;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { error } = await supabase
    .from("community_albums")
    .update(updates)
    .eq("id", albumId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: "Album updated" });
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
  const albumId = searchParams.get("albumId");

  if (!albumId) {
    return NextResponse.json({ error: "albumId query param is required" }, { status: 400 });
  }

  const { data: album } = await supabase
    .from("community_albums")
    .select("created_by")
    .eq("id", albumId)
    .eq("club_id", id)
    .single();

  if (!album) return NextResponse.json({ error: "Album not found" }, { status: 404 });

  const { data: membership } = await supabase
    .from("club_members")
    .select("role")
    .eq("club_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  const isOwner = album.created_by === user.id;
  const isAdmin = membership && ["owner", "moderator"].includes(membership.role);

  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Only album owner or admins can delete" }, { status: 403 });
  }

  const { error } = await supabase
    .from("community_albums")
    .delete()
    .eq("id", albumId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: "Album deleted" });
}
