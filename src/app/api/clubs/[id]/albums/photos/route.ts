import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

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
  const { albumId, photoUrl, thumbnailUrl, caption } = body;

  if (!albumId) return NextResponse.json({ error: "albumId is required" }, { status: 400 });
  if (!photoUrl) return NextResponse.json({ error: "photoUrl is required" }, { status: 400 });

  const { data: album } = await supabase
    .from("community_albums")
    .select("id")
    .eq("id", albumId)
    .eq("club_id", id)
    .single();

  if (!album) return NextResponse.json({ error: "Album not found" }, { status: 404 });

  const { count } = await supabase
    .from("community_album_photos")
    .select("id", { count: "exact", head: true })
    .eq("album_id", albumId);

  const { data: photo, error } = await supabase
    .from("community_album_photos")
    .insert({
      album_id: albumId,
      photo_url: photoUrl,
      thumbnail_url: thumbnailUrl || photoUrl,
      caption: caption || null,
      uploaded_by: user.id,
      position: count || 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.rpc("increment_album_photo_count", { p_album_id: albumId, p_delta: 1 });

  return NextResponse.json({
    data: {
      id: photo.id,
      photoUrl: photo.photo_url,
      thumbnailUrl: photo.thumbnail_url,
      caption: photo.caption,
      position: photo.position,
    },
  }, { status: 201 });
}

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

  const { searchParams } = new URL(request.url);
  const albumId = searchParams.get("albumId");

  if (!albumId) return NextResponse.json({ error: "albumId is required" }, { status: 400 });

  const { data: photos, error } = await supabase
    .from("community_album_photos")
    .select(`*, profiles:uploaded_by (id, name, avatar)`)
    .eq("album_id", albumId)
    .order("position", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    data: (photos || []).map((p: any) => ({
      id: p.id,
      photoUrl: p.photo_url,
      thumbnailUrl: p.thumbnail_url,
      caption: p.caption,
      position: p.position,
      uploadedBy: p.profiles ? { id: p.profiles.id, name: p.profiles.name, avatar: p.profiles.avatar } : null,
      createdAt: p.created_at,
    })),
  });
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
  const photoId = searchParams.get("photoId");
  if (!photoId) return NextResponse.json({ error: "photoId is required" }, { status: 400 });

  const { data: photo } = await supabase
    .from("community_album_photos")
    .select("uploaded_by, album_id")
    .eq("id", photoId)
    .single();

  if (!photo) return NextResponse.json({ error: "Photo not found" }, { status: 404 });

  const { data: album } = await supabase
    .from("community_albums")
    .select("club_id")
    .eq("id", photo.album_id)
    .single();

  if (!album || album.club_id !== id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isUploader = photo.uploaded_by === user.id;
  const { data: membership } = await supabase
    .from("club_members")
    .select("role")
    .eq("club_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  const isAdmin = membership && ["owner", "moderator"].includes(membership.role);

  if (!isUploader && !isAdmin) {
    return NextResponse.json({ error: "Only uploader or admins can delete" }, { status: 403 });
  }

  const { error } = await supabase
    .from("community_album_photos")
    .delete()
    .eq("id", photoId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.rpc("increment_album_photo_count", { p_album_id: photo.album_id, p_delta: -1 });

  return NextResponse.json({ message: "Photo deleted" });
}
