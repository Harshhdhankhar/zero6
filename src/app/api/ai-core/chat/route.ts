import { createServerSupabaseClient } from "@/lib/supabase/server";
import { processMessage } from "@/lib/ai-core";
import { createConversation } from "@/lib/ai-core/memory";
import { rateLimitMiddleware } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }

  const rateLimitResult = rateLimitMiddleware(user.id, "ai-core", 30, 60000);
  if (!rateLimitResult.allowed) {
    return new Response(JSON.stringify({ error: "Please wait a moment before sending another message." }), { status: 429, headers: { "Content-Type": "application/json" } });
  }

  const body = await request.json().catch(() => ({}));
  const message: string = (body.message || "").trim();
  let conversationId: string | undefined = body.conversationId;

  if (!message) {
    return new Response(JSON.stringify({ error: "Message is required" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  if (message.length > 4000) {
    return new Response(JSON.stringify({ error: "Message too long (max 4000 characters)" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  if (!conversationId) {
    const result = await createConversation(supabase, user.id, message.slice(0, 60));
    if (!result.conversation) {
      return new Response(JSON.stringify({ error: `Could not start conversation: ${result.error || "unknown error"}` }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
    conversationId = result.conversation.id;
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (type: string, data: unknown) => {
        try { controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type, data })}\n\n`)); } catch {}
      };

      try {
        const result = await processMessage(supabase, user.id, conversationId!, message);
        const words = result.content.split(" ");

        if (result.actions.length > 0) {
          send("action", {
            actions: result.actions,
            text: result.actions.map((a) => a.result ? `✅ ${a.name.replace(/_/g, " ")}` : `❌ ${a.name.replace(/_/g, " ")}`).join("\n"),
          });
        }

        for (let i = 0; i < words.length; i++) {
          send("token", (i > 0 ? " " : "") + words[i]);
          const delay = words[i].length <= 2 ? 8 : words[i].length <= 5 ? 15 : 20;
          await new Promise((r) => setTimeout(r, delay));
        }

        send("done", { conversationId: conversationId! });
      } catch (err: any) {
        const fallbacks = [
          "I hit a small snag — give me one moment.",
          "Let me try that again.",
        ];
        for (const fb of fallbacks) {
          send("token", fb + " ");
          await new Promise((r) => setTimeout(r, 300));
        }
        send("done", { conversationId: conversationId! });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
