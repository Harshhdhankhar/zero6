import { gatherContext } from "./context-engine";
import { buildSystemPrompt } from "./system-prompt";
import { executeAction, tools } from "./action-engine";
import { getConversationHistory, addMessage } from "./memory";
import { detectIntentAndBuildResponse } from "./intent-engine";

const GROK_API_KEY = process.env.XAI_API_KEY;

interface ProcessResult {
  content: string;
  actions: { name: string; result: boolean }[];
}

async function callLLM(
  messages: { role: string; content: string }[],
  temperature = 0.7,
  retries = 2
): Promise<any> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROK_API_KEY}`,
        },
        body: JSON.stringify({
          model: "grok-2-1212",
          messages,
          max_tokens: 1200,
          temperature,
          tools,
          tool_choice: "auto",
        }),
      });
      if (!res.ok) {
        if (attempt < retries) { await new Promise((r) => setTimeout(r, 1000 * (attempt + 1))); continue; }
        throw new Error(`LLM returned ${res.status}`);
      }
      return res.json();
    } catch (err) {
      if (attempt < retries) { await new Promise((r) => setTimeout(r, 1000 * (attempt + 1))); continue; }
      throw err;
    }
  }
}

export async function processMessage(
  supabase: any,
  userId: string,
  conversationId: string,
  message: string
): Promise<ProcessResult> {
  const ctx = await gatherContext(supabase, userId);

  const { response: handlerResponse, useLLM } = detectIntentAndBuildResponse(ctx, message, []);

  await addMessage(supabase, conversationId, "user", message);

  if (!useLLM && handlerResponse) {
    await addMessage(supabase, conversationId, "assistant", handlerResponse);
    return { content: handlerResponse, actions: [] };
  }

  const systemPrompt = buildSystemPrompt(ctx);
  const history = await getConversationHistory(supabase, conversationId, 30);
  const trimmedHistory = history.slice(-20);

  const allMessages: { role: string; content: string }[] = [
    { role: "system", content: systemPrompt },
    ...trimmedHistory,
    { role: "user", content: message },
  ];

  const executedActions: { name: string; result: boolean }[] = [];
  let finalContent = "";
  const currentMessages = [...allMessages];
  let maxIterations = 3;

  while (maxIterations > 0) {
    maxIterations--;
    const response = await callLLM(currentMessages);
    const choice = response.choices?.[0];
    if (!choice) throw new Error("No response from language model");

    const toolCalls = choice.message?.tool_calls;

    if (!toolCalls || toolCalls.length === 0) {
      finalContent = choice.message?.content || "";
      break;
    }

    currentMessages.push({ role: "assistant", content: choice.message?.content || "" });

    for (const toolCall of toolCalls) {
      const name = toolCall.function.name;
      let params: Record<string, unknown> = {};
      try { params = JSON.parse(toolCall.function.arguments); } catch {}

      currentMessages.push({ role: "assistant", content: `I'll ${name.replace(/_/g, " ")}.` });
      const result = await executeAction(supabase, userId, name, params);
      executedActions.push({ name, result: result.success });

      currentMessages.push({
        role: "system",
        content: `Action "${name}": ${result.success ? "Success" : "Failed"}${result.error ? " — " + result.error : ""}${result.data ? " " + JSON.stringify(result.data) : ""}. Respond naturally.`,
      });
    }
  }

  if (!finalContent) {
    if (executedActions.length > 0) {
      finalContent = executedActions.map((a) =>
        a.result ? `Done! ${a.name.replace(/_/g, " ")} completed.` : `Couldn't ${a.name.replace(/_/g, " ")}.`
      ).join(" ");
    } else {
      const dashboard = ctx.dashboard;
      if (dashboard.weeklyDistance > 0) {
        finalContent = `You're at **${dashboard.weeklyDistance >= 1000 ? (dashboard.weeklyDistance / 1000).toFixed(1) + " km" : Math.round(dashboard.weeklyDistance) + " m"}** this week. What would you like to focus on?`;
      } else {
        finalContent = "Ready when you are. Ask me about your progress, training plans, events, or anything running-related.";
      }
    }
  }

  await addMessage(supabase, conversationId, "assistant", finalContent);
  return { content: finalContent, actions: executedActions };
}
