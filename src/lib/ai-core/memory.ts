import type { ConversationSummary, ChatMessage } from "./types";

function formatGroupKey(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const dayMs = 86400000;
  if (diff < dayMs) return "today";
  if (diff < 2 * dayMs) return "yesterday";
  if (diff < 7 * dayMs) return "this_week";
  return "earlier";
}

function autoGenerateTitle(content: string): string {
  const cleaned = content.replace(/[^\w\s]/g, "").trim();
  if (cleaned.length <= 50) return cleaned;
  return cleaned.slice(0, 47) + "...";
}

export async function listConversations(supabase: any, userId: string): Promise<ConversationSummary[]> {
  const { data, error } = await supabase
    .from("coach_conversations")
    .select("id, title, created_at, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error || !data) return [];

  const convIds = data.map((c: any) => c.id);
  const { data: msgCounts } = await supabase
    .from("coach_messages")
    .select("conversation_id, content, created_at")
    .in("conversation_id", convIds)
    .order("created_at", { ascending: false });

  const msgMap = new Map<string, { content: string; createdAt: string }[]>();
  for (const msg of msgCounts || []) {
    if (!msgMap.has(msg.conversation_id)) msgMap.set(msg.conversation_id, []);
    msgMap.get(msg.conversation_id)!.push(msg);
  }

  return data.map((conv: any) => {
    const msgs = msgMap.get(conv.id) || [];
    const lastMsg = msgs.length > 0 ? msgs[0] : null;
    return {
      id: conv.id,
      title: conv.title || "New conversation",
      createdAt: conv.created_at,
      updatedAt: conv.updated_at,
      messageCount: msgs.length,
      preview: lastMsg ? lastMsg.content.slice(0, 80) : undefined,
      group: formatGroupKey(new Date(conv.updated_at)),
    };
  });
}

export async function createConversation(
  supabase: any,
  userId: string,
  title?: string
): Promise<{ conversation: ConversationSummary | null; error?: string }> {
  const { data, error } = await supabase
    .from("coach_conversations")
    .insert({ user_id: userId, title: title || "New conversation" })
    .select()
    .single();

  if (error) {
    return { conversation: null, error: error.message };
  }
  if (!data) {
    return { conversation: null, error: "No data returned" };
  }
  return {
    conversation: {
      id: data.id,
      title: data.title || "New conversation",
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      messageCount: 0,
      group: "today",
    },
  };
}

export async function updateConversation(
  supabase: any,
  conversationId: string,
  userId: string,
  updates: { title?: string; pinned?: boolean; archived?: boolean }
): Promise<boolean> {
  const payload: Record<string, unknown> = { ...updates, updated_at: new Date().toISOString() };
  const { error } = await supabase
    .from("coach_conversations")
    .update(payload)
    .eq("id", conversationId)
    .eq("user_id", userId);
  return !error;
}

export async function deleteConversation(supabase: any, conversationId: string, userId: string): Promise<boolean> {
  const { error: msgErr } = await supabase
    .from("coach_messages")
    .delete()
    .eq("conversation_id", conversationId);
  if (msgErr) return false;

  const { error } = await supabase
    .from("coach_conversations")
    .delete()
    .eq("id", conversationId)
    .eq("user_id", userId);
  return !error;
}

export async function getMessages(
  supabase: any,
  conversationId: string,
  userId: string
): Promise<ChatMessage[]> {
  const { data: conv } = await supabase
    .from("coach_conversations")
    .select("id")
    .eq("id", conversationId)
    .eq("user_id", userId)
    .single();

  if (!conv) return [];

  const { data: msgs } = await supabase
    .from("coach_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (!msgs) return [];
  return msgs.map((m: any) => ({
    id: m.id,
    conversationId: m.conversation_id,
    role: m.role,
    content: m.content,
    createdAt: m.created_at,
  }));
}

export async function addMessage(
  supabase: any,
  conversationId: string,
  role: "user" | "assistant" | "system",
  content: string
): Promise<ChatMessage | null> {
  const { data, error } = await supabase
    .from("coach_messages")
    .insert({ conversation_id: conversationId, role, content })
    .select()
    .single();

  if (error || !data) return null;

  await supabase
    .from("coach_conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);

  if (role === "user") {
    const { data: conv } = await supabase
      .from("coach_conversations")
      .select("title")
      .eq("id", conversationId)
      .single();

    if (conv && conv.title === "New conversation") {
      const autoTitle = autoGenerateTitle(content);
      await supabase
        .from("coach_conversations")
        .update({ title: autoTitle })
        .eq("id", conversationId);
    }
  }

  return {
    id: data.id,
    conversationId: data.conversation_id,
    role: data.role,
    content: data.content,
    createdAt: data.created_at,
  };
}

export async function getConversationHistory(
  supabase: any,
  conversationId: string,
  limit = 20
) {
  const { data } = await supabase
    .from("coach_messages")
    .select("role, content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!data) return [];
  return data.reverse().map((m: any) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));
}
