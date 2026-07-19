import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { sendMessageSchema, validateBody } from "@/lib/validations";
import { rateLimitMiddleware } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const participantId = searchParams.get("userId");

  if (participantId) {
    const { data: messages, error } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${participantId}),and(sender_id.eq.${participantId},receiver_id.eq.${user.id})`
      )
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("sender_id", participantId)
      .eq("receiver_id", user.id)
      .eq("is_read", false);

    const formatted = (messages || []).map((m: any) => ({
      id: m.id,
      content: m.content,
      sender: m.sender_id === user.id ? "me" : "them",
      time: new Date(m.created_at).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }),
      read: m.is_read,
      createdAt: m.created_at,
    }));

    return NextResponse.json({ data: formatted });
  }

  const { data: messages, error } = await supabase
    .from("messages")
    .select(`
      *,
      sender:sender_id (id, name, avatar),
      receiver:receiver_id (id, name, avatar)
    `)
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const conversationMap = new Map<
    string,
    {
      id: string;
      participantId: string;
      participantName: string;
      participantAvatar: string;
      lastMessage: string;
      lastMessageTime: string;
      unreadCount: number;
      isOnline: boolean;
    }
  >();

  for (const m of messages || []) {
    const otherId = m.sender_id === user.id ? m.receiver_id : m.sender_id;
    const otherProfile = m.sender_id === user.id ? m.receiver : m.sender;

    if (!conversationMap.has(otherId)) {
      conversationMap.set(otherId, {
        id: otherId,
        participantId: otherId,
        participantName: otherProfile?.name || "Unknown",
        participantAvatar: otherProfile?.avatar || "",
        lastMessage: m.content,
        lastMessageTime: m.created_at,
        unreadCount: 0,
        isOnline: false,
      });
    }

    if (m.receiver_id === user.id && !m.is_read) {
      const conv = conversationMap.get(otherId)!;
      conv.unreadCount += 1;
    }
  }

  const conversations = Array.from(conversationMap.values()).sort(
    (a, b) =>
      new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
  );

  return NextResponse.json({
    data: conversations,
    meta: { total: conversations.length },
  });
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateCheck = rateLimitMiddleware(user.id, "sendMessage");
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await request.json();
  const parsed = validateBody(sendMessageSchema, body);
  if (!parsed.success) return parsed.response;
  const { receiverId, content } = parsed.data;

  const { data: message, error } = await supabase
    .from("messages")
    .insert({
      sender_id: user.id,
      receiver_id: receiverId,
      content,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    {
      data: {
        id: message.id,
        content: message.content,
        sender: "me",
        time: new Date(message.created_at).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        }),
        read: false,
        createdAt: message.created_at,
      },
    },
    { status: 201 }
  );
}
