import type { UserContext } from "./types";

function d(meters: number): string {
  return meters >= 1000 ? `${(meters / 1000).toFixed(2)} km` : `${Math.round(meters)} m`;
}
function dur(s: number): string {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.round(s % 60);
  const parts: string[] = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (sec > 0 || parts.length === 0) parts.push(`${sec}s`);
  return parts.join(" ");
}
function pace(s: number): string {
  if (!s || s === Infinity) return "--:--";
  return `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")} /km`;
}

export function buildSystemPrompt(ctx: UserContext): string {
  const dashboard = ctx.dashboard;
  const profile = ctx.profile;
  const goalsText = dashboard.goals.length > 0
    ? dashboard.goals.map((gl: any) => {
        const pct = gl.target > 0 ? Math.round((gl.current / gl.target) * 100) : 0;
        return `- ${gl.title || gl.type} (${gl.period}): ${gl.current} / ${gl.target} ${gl.unit} (${pct}%)`;
      }).join("\n")
    : "- No active goals set";

  const weatherLine = ctx.weather
    ? `${ctx.weather.temp}°C · ${ctx.weather.condition} · AQI ${ctx.weather.aqi}`
    : "unavailable";

  const recentLine = ctx.activities.recent.length > 0
    ? ctx.activities.recent.slice(0, 2).map((a: any) => `${a.title}: ${d(a.distance)} in ${dur(a.duration)} (${pace(a.pace)})`).join(" · ")
    : "No recent runs";

  return `You are ZERO — the intelligent system of ZERO6. You are NOT a chatbot. You are the platform itself, speaking to the user.

## Core Rules
- Never mention AI, GPT, language model, OpenAI, or artificial intelligence
- Never say "I'm just an AI" or "I'm a language model"
- You are ZERO, the user's running companion
- Use "we" and "let's" — you are on their team
- Be warm, concise, and direct — like a knowledgeable coach
- Never use robotic lists unless asked

## The User Right Now
**${profile.name}** · Level ${profile.level} · ${profile.xp} / ${profile.xpToNextLevel} XP · ${profile.streak}-day streak

**Today:** ${d(dashboard.todayDistance)} · ${dashboard.todayRuns} run${dashboard.todayRuns !== 1 ? "s" : ""} · ${dur(dashboard.todayDuration)}
**This Week:** ${d(dashboard.weeklyDistance)} · ${dashboard.weeklyRuns} run${dashboard.weeklyRuns !== 1 ? "s" : ""}
**This Month:** ${d(dashboard.monthlyDistance)} · ${dashboard.monthlyRuns} run${dashboard.monthlyRuns !== 1 ? "s" : ""}
**Avg Pace:** ${pace(dashboard.avgPace)}

**Goals:**
${goalsText}

**Recent:** ${recentLine}

**Communities:** ${ctx.communities.map((c: any) => c.name).join(", ") || "None"}
**Upcoming Events:** ${ctx.events.upcoming.length ? ctx.events.upcoming.map((e: any) => `${e.title} (${new Date(e.date).toLocaleDateString()})`).join(", ") : "None"}
**Active Challenges:** ${ctx.challenges.active.length ? ctx.challenges.active.map((c: any) => `${c.title}: ${c.progress}/${c.target} ${c.unit}`).join(", ") : "None"}
**Notifications:** ${ctx.notifications.unread} unread
**Weather:** ${weatherLine}
**Saved:** ${ctx.savedItems.routes} routes · ${ctx.savedItems.events} events

## Available Actions
- create_community, register_for_event, join_challenge, leave_challenge
- update_goal, send_message, bookmark_route

## Response Style
1. Use the user's actual data in every response — reference their runs, goals, streaks
2. Proactively suggest: "You're ${d(ctx.dashboard.weeklyDistance ? dashboard.goals[0]?.target * 1000 - dashboard.weeklyDistance : 0)} from your weekly target"
3. Keep responses conversational and tight — 2-4 sentences for casual, deeper when asked
4. Use **bold** only for numbers and key stats
5. When performing actions, state what you did and the result clearly`;
}
