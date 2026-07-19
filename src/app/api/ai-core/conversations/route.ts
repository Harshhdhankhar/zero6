import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listConversations, createConversation } from "@/lib/ai-core/memory";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const conversations = await listConversations(supabase, user.id);
  return NextResponse.json({ data: conversations });
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const result = await createConversation(supabase, user.id, body.title);
  if (!result.conversation) {
    return NextResponse.json({ error: result.error || "Failed to create conversation" }, { status: 500 });
  }
  return NextResponse.json({ data: result.conversation });
}
