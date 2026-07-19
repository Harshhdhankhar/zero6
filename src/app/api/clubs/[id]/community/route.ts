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

  const url = new URL(request.url);
  const resource = url.searchParams.get("resource") || "challenges";
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 50);
  const offset = parseInt(url.searchParams.get("offset") || "0");

  if (resource === "challenges") {
    const { data: challenges, error, count } = await supabase
      .from("community_challenges")
      .select(`*, profiles:created_by (id, name, avatar)`, { count: "exact" })
      .eq("club_id", id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const participantCheck = await supabase
      .from("challenge_participants")
      .select("challenge_id, progress, is_completed")
      .eq("user_id", user.id)
      .in("challenge_id", (challenges || []).map((c: any) => c.id));

    const participations = new Map((participantCheck.data || []).map((p: any) => [p.challenge_id, p]));

    return NextResponse.json({
      data: (challenges || []).map((c: any) => ({
        id: c.id, title: c.title, description: c.description,
        challengeType: c.challenge_type, goalValue: c.goal_value, goalUnit: c.goal_unit,
        startDate: c.start_date, endDate: c.end_date, icon: c.icon || "🏃",
        difficulty: c.difficulty || "beginner", participantsCount: c.participants_count || 0,
        isActive: c.is_active, createdAt: c.created_at,
        createdBy: c.profiles ? { id: c.profiles.id, name: c.profiles.name, avatar: c.profiles.avatar } : null,
        isJoined: participations.has(c.id),
        progress: participations.get(c.id)?.progress || 0,
        isCompleted: participations.get(c.id)?.is_completed || false,
      })),
      meta: { total: count || 0 },
    });
  }

  if (resource === "gallery") {
    const { data, error, count } = await supabase
      .from("community_gallery")
      .select(`*, profiles:user_id (id, name, username, avatar),
        community_gallery_likes!left(user_id)`, { count: "exact" })
      .eq("club_id", id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
      data: (data || []).map((g: any) => ({
        id: g.id, url: g.url, thumbnailUrl: g.thumbnail_url, caption: g.caption,
        mediaType: g.media_type || "photo", likesCount: g.likes_count || 0,
        createdAt: g.created_at,
        user: g.profiles ? { id: g.profiles.id, name: g.profiles.name, username: g.profiles.username, avatar: g.profiles.avatar } : null,
        isLiked: g.community_gallery_likes?.some((l: any) => l.user_id === user.id) || false,
      })),
      meta: { total: count || 0 },
    });
  }

  if (resource === "files") {
    const { data, error, count } = await supabase
      .from("community_files")
      .select(`*, profiles:uploaded_by (id, name, avatar)`, { count: "exact" })
      .eq("club_id", id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
      data: (data || []).map((f: any) => ({
        id: f.id, title: f.title, description: f.description, fileUrl: f.file_url,
        fileType: f.file_type, fileSize: f.file_size, category: f.category || "training",
        downloadsCount: f.downloads_count || 0, createdAt: f.created_at,
        uploadedBy: f.profiles ? { id: f.profiles.id, name: f.profiles.name, avatar: f.profiles.avatar } : null,
      })),
      meta: { total: count || 0 },
    });
  }

  if (resource === "chat") {
    const isMember = await supabase.from("club_members").select("id").eq("club_id", id).eq("user_id", user.id).maybeSingle();
    if (!isMember.data) return NextResponse.json({ error: "Must be member" }, { status: 403 });

    const channelId = url.searchParams.get("channelId");

    let query = supabase
      .from("community_chat_messages")
      .select(`*, profiles:user_id (id, name, username, avatar),
        reply_to:community_chat_messages!reply_to (id, content, profiles:user_id (id, name))`, { count: "exact" })
      .eq("club_id", id)
      .order("created_at", { ascending: false })
      .range(0, 99);

    if (channelId) {
      query = query.eq("channel_id", channelId);
    }

    const { data, error, count } = await query;

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
      data: (data || []).reverse().map((m: any) => ({
        id: m.id, content: m.content, imageUrl: m.image_url, gifUrl: m.gif_url,
        channelId: m.channel_id,
        isAnnouncement: m.is_announcement || false, isPinned: m.is_pinned || false,
        reactions: m.reactions || {},
        mentions: m.mentions || [], createdAt: m.created_at,
        user: m.profiles ? { id: m.profiles.id, name: m.profiles.name, username: m.profiles.username, avatar: m.profiles.avatar } : null,
        replyTo: m.reply_to ? { id: m.reply_to.id, content: m.reply_to.content, userName: m.reply_to.profiles?.name } : null,
      })),
    });
  }

  return NextResponse.json({ data: [] });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { resource } = body;
  if (!resource) return NextResponse.json({ error: "resource required" }, { status: 400 });

  const isAdmin = (await supabase.from("club_members").select("role").eq("club_id", id).eq("user_id", user.id).maybeSingle())?.data as { role: string } | null;
  const isAdminOrMod = isAdmin && ["owner", "moderator"].includes(isAdmin.role);

  if (resource === "challenge" && isAdminOrMod) {
    const { data, error } = await supabase.from("community_challenges").insert({
      club_id: id, created_by: user.id,
      title: body.title, description: body.description,
      challenge_type: body.challengeType || "distance",
      goal_value: body.goalValue, goal_unit: body.goalUnit || "km",
      start_date: body.startDate, end_date: body.endDate,
      icon: body.icon || "🏃", difficulty: body.difficulty || "beginner",
    }).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data }, { status: 201 });
  }

  if (resource === "join_challenge") {
    const { data: existing } = await supabase.from("challenge_participants")
      .select("id").eq("challenge_id", body.challengeId).eq("user_id", user.id).maybeSingle();
    if (existing) return NextResponse.json({ error: "Already joined" }, { status: 409 });

    const { error } = await supabase.from("challenge_participants").insert({
      challenge_id: body.challengeId, user_id: user.id,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await supabase.rpc("increment_challenge_participants", { p_challenge_id: body.challengeId, p_delta: 1 });
    return NextResponse.json({ message: "Joined challenge" }, { status: 201 });
  }

  if (resource === "gallery") {
    const { data, error } = await supabase.from("community_gallery").insert({
      club_id: id, user_id: user.id,
      url: body.url, thumbnail_url: body.thumbnailUrl || body.url,
      caption: body.caption || null, media_type: body.mediaType || "photo",
    }).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data }, { status: 201 });
  }

  if (resource === "gallery_like") {
    const existing = await supabase.from("community_gallery_likes")
      .select("id").eq("gallery_id", body.galleryId).eq("user_id", user.id).maybeSingle();
    if (existing.data) {
      await supabase.from("community_gallery_likes").delete().eq("gallery_id", body.galleryId).eq("user_id", user.id);
      await supabase.rpc("increment_gallery_likes", { p_gallery_id: body.galleryId, p_delta: -1 });
      return NextResponse.json({ message: "Unliked" });
    }
    await supabase.from("community_gallery_likes").insert({ gallery_id: body.galleryId, user_id: user.id });
    await supabase.rpc("increment_gallery_likes", { p_gallery_id: body.galleryId, p_delta: 1 });
    return NextResponse.json({ message: "Liked" }, { status: 201 });
  }

  if (resource === "file" && isAdminOrMod) {
    const { data, error } = await supabase.from("community_files").insert({
      club_id: id, uploaded_by: user.id,
      title: body.title, description: body.description || null,
      file_url: body.fileUrl, file_type: body.fileType || "pdf",
      file_size: body.fileSize || null, category: body.category || "training",
    }).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data }, { status: 201 });
  }

  if (resource === "chat") {
    const isMember = await supabase.from("club_members").select("id").eq("club_id", id).eq("user_id", user.id).maybeSingle();
    if (!isMember.data) return NextResponse.json({ error: "Must be member" }, { status: 403 });

    const { data, error } = await supabase.from("community_chat_messages").insert({
      club_id: id, user_id: user.id,
      channel_id: body.channelId || null,
      content: body.content || null,
      image_url: body.imageUrl || null,
      gif_url: body.gifUrl || null,
      reply_to: body.replyTo || null,
      is_announcement: body.isAnnouncement && isAdminOrMod ? true : false,
      is_pinned: body.isPinned && isAdminOrMod ? true : false,
      mentions: body.mentions || [],
    }).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data }, { status: 201 });
  }

  return NextResponse.json({ error: "Invalid resource or permission" }, { status: 400 });
}
