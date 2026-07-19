import type { ActionResult } from "./types";
import { checkPermission } from "./permission-engine";

export const tools = [
  {
    type: "function" as const,
    function: {
      name: "create_community",
      description: "Create a new running community",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Community name" },
          description: { type: "string", description: "Community description" },
          location: { type: "string", description: "City or area" },
          category: { type: "string", enum: ["road", "trail", "track", "casual", "competitive", "social"] },
        },
        required: ["name", "description"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "register_for_event",
      description: "Register the user for an event",
      parameters: {
        type: "object",
        properties: {
          eventId: { type: "string", description: "Event ID to register for" },
        },
        required: ["eventId"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "join_challenge",
      description: "Join a running challenge",
      parameters: {
        type: "object",
        properties: {
          challengeId: { type: "string", description: "Challenge ID to join" },
        },
        required: ["challengeId"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "leave_challenge",
      description: "Leave a challenge the user has joined",
      parameters: {
        type: "object",
        properties: {
          challengeId: { type: "string", description: "Challenge ID to leave" },
        },
        required: ["challengeId"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "update_goal",
      description: "Set or update a running goal",
      parameters: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["distance", "frequency", "duration"], description: "Goal type" },
          target: { type: "number", description: "Target value" },
          unit: { type: "string", description: "Unit (km, runs, minutes, etc.)" },
          period: { type: "string", enum: ["weekly", "monthly"], description: "Goal period" },
        },
        required: ["type", "target", "unit", "period"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "send_message",
      description: "Send a direct message to another user",
      parameters: {
        type: "object",
        properties: {
          receiverId: { type: "string", description: "User ID of the receiver" },
          content: { type: "string", description: "Message content" },
        },
        required: ["receiverId", "content"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "bookmark_route",
      description: "Save a route to bookmarks",
      parameters: {
        type: "object",
        properties: {
          routeId: { type: "string", description: "Route ID to bookmark" },
        },
        required: ["routeId"],
      },
    },
  },
];

export async function executeAction(
  supabase: any,
  userId: string,
  actionName: string,
  params: Record<string, unknown>
): Promise<ActionResult> {
  const perm = await checkPermission(supabase, userId, actionName, params);
  if (!perm.allowed) {
    return { success: false, error: perm.reason || "Permission denied" };
  }

  try {
    switch (actionName) {
      case "create_community": {
        const { data, error } = await supabase.from("clubs").insert({
          name: params.name,
          description: params.description,
          location: params.location || null,
          category: params.category || "casual",
          created_by_id: userId,
          member_count: 1,
        }).select().single();
        if (error) return { success: false, error: error.message };
        await supabase.from("club_members").insert({
          club_id: data.id,
          user_id: userId,
          role: "owner",
        });
        return { success: true, data: { id: data.id, name: data.name } };
      }

      case "register_for_event": {
        const { error } = await supabase.from("event_registrations").insert({
          event_id: params.eventId,
          user_id: userId,
        });
        if (error) return { success: false, error: error.message };
        await supabase.rpc("increment_event_registration", { event_id: params.eventId });
        return { success: true, data: { eventId: params.eventId } };
      }

      case "join_challenge": {
        const { error } = await supabase.from("challenge_participants").insert({
          challenge_id: params.challengeId,
          user_id: userId,
          current: 0,
        });
        if (error) return { success: false, error: error.message };
        return { success: true, data: { challengeId: params.challengeId } };
      }

      case "leave_challenge": {
        const { error } = await supabase
          .from("challenge_participants")
          .delete()
          .eq("challenge_id", params.challengeId)
          .eq("user_id", userId);
        if (error) return { success: false, error: error.message };
        return { success: true, data: { challengeId: params.challengeId } };
      }

      case "update_goal": {
        const existing = await supabase
          .from("user_goals")
          .select("id")
          .eq("user_id", userId)
          .eq("type", params.type)
          .eq("period", params.period)
          .eq("is_active", true)
          .maybeSingle();
        if (existing.data) {
          const { error } = await supabase
            .from("user_goals")
            .update({ target: params.target, unit: params.unit })
            .eq("id", existing.data.id);
          if (error) return { success: false, error: error.message };
        } else {
          const { error } = await supabase.from("user_goals").insert({
            user_id: userId,
            type: params.type,
            target: params.target,
            unit: params.unit,
            period: params.period,
            is_active: true,
          });
          if (error) return { success: false, error: error.message };
        }
        return { success: true, data: { type: params.type, target: params.target, period: params.period } };
      }

      case "send_message": {
        const { error } = await supabase.from("messages").insert({
          sender_id: userId,
          receiver_id: params.receiverId,
          content: params.content,
        });
        if (error) return { success: false, error: error.message };
        return { success: true, data: { receiverId: params.receiverId } };
      }

      case "bookmark_route": {
        const { error } = await supabase.from("saved_items").insert({
          user_id: userId,
          item_type: "route",
          item_id: params.routeId,
        });
        if (error) return { success: false, error: error.message };
        return { success: true, data: { routeId: params.routeId } };
      }

      default:
        return { success: false, error: `Unknown action: ${actionName}` };
    }
  } catch (err: any) {
    return { success: false, error: err.message || "Action failed" };
  }
}
