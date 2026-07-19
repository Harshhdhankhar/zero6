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

  const { data: channels, error } = await supabase
    .from("community_chat_channels")
    .select("*")
    .eq("club_id", id)
    .order("position", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const formatted = (channels || []).map((ch: any) => ({
    id: ch.id,
    name: ch.name,
    description: ch.description,
    icon: ch.icon,
    isDefault: ch.is_default,
    isAnnouncementOnly: ch.is_announcement_only,
    position: ch.position,
    createdBy: ch.created_by,
    createdAt: ch.created_at,
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

  if (!membership || !["owner", "moderator"].includes(membership.role)) {
    return NextResponse.json({ error: "Only owners and moderators can create channels" }, { status: 403 });
  }

  const body = await request.json();
  const { name, description, icon, isAnnouncementOnly } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Channel name is required" }, { status: 400 });
  }

  const sanitizedName = name.toLowerCase().replace(/[^a-z0-9-_]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");

  const { count } = await supabase
    .from("community_chat_channels")
    .select("id", { count: "exact", head: true })
    .eq("club_id", id);

  const { data: channel, error } = await supabase
    .from("community_chat_channels")
    .insert({
      club_id: id,
      name: sanitizedName,
      description: description || "",
      icon: icon || "💬",
      is_default: false,
      is_announcement_only: isAnnouncementOnly || false,
      position: count || 0,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "A channel with this name already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data: {
      id: channel.id,
      name: channel.name,
      description: channel.description,
      icon: channel.icon,
      isDefault: channel.is_default,
      isAnnouncementOnly: channel.is_announcement_only,
      position: channel.position,
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

  const { data: membership } = await supabase
    .from("club_members")
    .select("role")
    .eq("club_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership || !["owner", "moderator"].includes(membership.role)) {
    return NextResponse.json({ error: "Only owners and moderators can update channels" }, { status: 403 });
  }

  const body = await request.json();
  const { channelId, name, description, icon, isAnnouncementOnly } = body;

  if (!channelId) {
    return NextResponse.json({ error: "channelId is required" }, { status: 400 });
  }

  const updates: Record<string, any> = {};
  if (name !== undefined) {
    const sanitizedName = name.toLowerCase().replace(/[^a-z0-9-_]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    updates.name = sanitizedName;
  }
  if (description !== undefined) updates.description = description;
  if (icon !== undefined) updates.icon = icon;
  if (isAnnouncementOnly !== undefined) updates.is_announcement_only = isAnnouncementOnly;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { error } = await supabase
    .from("community_chat_channels")
    .update(updates)
    .eq("id", channelId)
    .eq("club_id", id);

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "A channel with this name already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Channel updated" });
}

export async function DELETE(
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

  if (!membership || !["owner", "moderator"].includes(membership.role)) {
    return NextResponse.json({ error: "Only owners and moderators can delete channels" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const channelId = searchParams.get("channelId");

  if (!channelId) {
    return NextResponse.json({ error: "channelId query param is required" }, { status: 400 });
  }

  const { data: channel } = await supabase
    .from("community_chat_channels")
    .select("is_default")
    .eq("id", channelId)
    .eq("club_id", id)
    .single();

  if (channel?.is_default) {
    return NextResponse.json({ error: "Cannot delete the default channel" }, { status: 400 });
  }

  const { error } = await supabase
    .from("community_chat_channels")
    .delete()
    .eq("id", channelId)
    .eq("club_id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: "Channel deleted" });
}
