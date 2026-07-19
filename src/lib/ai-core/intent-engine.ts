import type { UserContext } from "./types";

export type Intent =
  | "greeting"
  | "dashboard_summary"
  | "activity_analysis"
  | "route_recommendation"
  | "nearby_communities"
  | "upcoming_events"
  | "improve_performance"
  | "training_plan"
  | "weather"
  | "challenges"
  | "recommendation"
  | "general";

interface IntentMatch {
  intent: Intent;
  confidence: number;
}

function d(meters: number): string {
  if (!meters) return "0 km";
  return meters >= 1000 ? `${(meters / 1000).toFixed(2)} km` : `${Math.round(meters)} m`;
}

function dur(seconds: number): string {
  if (!seconds) return "0m";
  const h = Math.floor(seconds / 3600), m = Math.floor((seconds % 3600) / 60), s = Math.round(seconds % 60);
  const parts: string[] = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (s > 0 || parts.length === 0) parts.push(`${s}s`);
  return parts.join(" ");
}

function paceStr(secondsPerKm: number): string {
  if (!secondsPerKm || secondsPerKm === Infinity) return "--:--";
  return `${Math.floor(secondsPerKm / 60)}:${String(Math.round(secondsPerKm % 60)).padStart(2, "0")} /km`;
}

function timeGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function classifyIntent(text: string): IntentMatch {
  const query = text.toLowerCase().trim();

  const patterns: [RegExp, Intent, number][] = [
    [/^(hello|hi|hey|howdy|good morning|good evening|good afternoon|sup|yo)\b/, "greeting", 0.95],
    [/^(how are you|how's it going|what's up|how do you do)\b/, "greeting", 0.95],
    [/^(what can you do|what do you do|help|commands)\b/, "greeting", 0.9],
    [/^analyze|analysis|how did i (run|do|perform)\b/, "activity_analysis", 0.9],
    [/my (runs|activities|workouts|training)\b/, "activity_analysis", 0.85],
    [/(show|view|check) (my )?(runs|activities|workouts)/, "activity_analysis", 0.85],
    [/progress|summary|how am i doing|this week|this month/, "dashboard_summary", 0.9],
    [/dashboard|overview|stats|statistics|performance/, "dashboard_summary", 0.85],
    [/summarize|recap|roundup/, "dashboard_summary", 0.8],
    [/route|where (should|can) i run|running path|trail/, "route_recommendation", 0.9],
    [/recommend( a|ed)? route|suggest (a )?route/, "route_recommendation", 0.95],
    [/find (a )?place to run|good place to run/, "route_recommendation", 0.85],
    [/community|club|find.*(people|runners|group)/, "nearby_communities", 0.9],
    [/nearby (clubs|communities|groups|runners)/, "nearby_communities", 0.95],
    [/join (a )?club|find (a )?community/, "nearby_communities", 0.85],
    [/event|race|upcoming|what.*next.*event/, "upcoming_events", 0.9],
    [/races (near|around|this month)/, "upcoming_events", 0.9],
    [/registered events|my events/, "upcoming_events", 0.85],
    [/5k|5 km|improv.*pace|get faster|speed|better time/, "improve_performance", 0.9],
    [/how (can|do) i improv|become a better runner|running tips/, "improve_performance", 0.85],
    [/training plan|create.*plan|build.*plan|workout plan/, "training_plan", 0.95],
    [/plan for (a )?(marathon|half|5k|10k|race)/, "training_plan", 0.95],
    [/weather|temperature|aqi|air quality|is it good to run/, "weather", 0.95],
    [/howeather.*weather|should i run (today|outside|now)/, "weather", 0.9],
    [/challenge|goal|my (challenges|goals)/, "challenges", 0.9],
    [/active challenges|challenge progress/, "challenges", 0.85],
    [/recommend|suggestion|what should (i|we)/, "recommendation", 0.8],
    [/give me advice|what do you suggest/, "recommendation", 0.8],
  ];

  for (const [regex, intent, confidence] of patterns) {
    if (regex.test(query)) return { intent, confidence };
  }

  return { intent: "general", confidence: 0.5 };
}

export function buildGreeting(ctx: UserContext): string {
  const name = ctx.profile.name;
  const streak = ctx.profile.streak;
  const week = ctx.dashboard.weeklyDistance;
  const month = ctx.dashboard.monthlyDistance;
  const goals = ctx.dashboard.goals;
  const weather = ctx.weather;

  const greeting = timeGreeting();
  const parts: string[] = [`${greeting}, ${name}.`];

  if (week > 0) {
    parts.push(`You've run ${d(week)} this week across ${ctx.dashboard.weeklyRuns} run${ctx.dashboard.weeklyRuns !== 1 ? "s" : ""}.`);
    const goal = goals.find((gl) => gl.period === "weekly");
    if (goal && goal.target > 0) {
      const pct = Math.round((week / (goal.target * 1000)) * 100);
      parts.push(`That's ${pct}% of your weekly target.`);
    }
  } else if (month > 0) {
    parts.push(`You've covered ${d(month)} this month — solid work.`);
  } else {
    parts.push(`No runs logged yet this week. Ready to get moving?`);
  }

  if (streak > 0) {
    parts.push(`Your streak is ${streak} day${streak !== 1 ? "s" : ""}.`);
  }

  if (weather) {
    parts.push(`${weather.temp}°C and ${weather.condition}${weather.aqi > 100 ? " — AQI elevated, consider a mask or indoor run" : " — great conditions"} right noweather.`);
  }

  parts.push("What are we working on today?");
  return parts.join(" ");
}

export function buildDashboardSummary(ctx: UserContext): string {
  const dashboard = ctx.dashboard;
  const profile = ctx.profile;
  const recent = ctx.activities.recent;
  const parts: string[] = [];

  parts.push(`**${profile.name}** · Level ${profile.level} · ${profile.xp} XP · **${profile.streak}-day streak**`);

  if (dashboard.weeklyDistance > 0 || dashboard.monthlyDistance > 0) {
    parts.push(``);
    parts.push(`**This Week:** ${d(dashboard.weeklyDistance)} across ${dashboard.weeklyRuns} run${dashboard.weeklyRuns !== 1 ? "s" : ""} · ${dur(dashboard.weeklyDuration)}`);
    parts.push(`**This Month:** ${d(dashboard.monthlyDistance)} across ${dashboard.monthlyRuns} run${dashboard.monthlyRuns !== 1 ? "s" : ""}`);
    if (dashboard.avgPace) parts.push(`**Avg Pace:** ${paceStr(dashboard.avgPace)}`);
  } else {
    parts.push(`No runs logged this period.`);
  }

  const goals = dashboard.goals;
  if (goals.length > 0) {
    parts.push(``);
    parts.push(`**Goals**`);
    for (const gl of goals) {
      const current = gl.type === "distance" ? d(gl.current * 1000) : `${gl.current}`;
      const target = gl.type === "distance" ? d(gl.target * 1000) : `${gl.target}`;
      const pct = gl.target > 0 ? Math.round((gl.current / gl.target) * 100) : 0;
      parts.push(`- ${gl.title || gl.type} (${gl.period}): ${current} / ${target} — ${pct}%`);
    }
  }

  if (recent.length > 0) {
    parts.push(``);
    parts.push(`**Recent Runs**`);
    for (const r of recent.slice(0, 3)) {
      parts.push(`- ${r.title}: ${d(r.distance)} in ${dur(r.duration)} @ ${paceStr(r.pace)}`);
    }
  }

  if (ctx.challenges.active.length > 0) {
    parts.push(``);
    parts.push(`**Active Challenges**`);
    for (const c of ctx.challenges.active) {
      const pct = c.target > 0 ? Math.round((c.progress / c.target) * 100) : 0;
      parts.push(`- ${c.title}: ${c.progress} / ${c.target} ${c.unit} (${pct}%)`);
    }
  }

  if (ctx.events.upcoming.length > 0) {
    parts.push(``);
    parts.push(`**Upcoming Events**`);
    for (const e of ctx.events.upcoming) {
      parts.push(`- ${e.title} — ${new Date(e.date).toLocaleDateString()} at ${e.location}`);
    }
  }

  if (ctx.notifications.unread > 0) {
    parts.push(``);
    parts.push(`You have **${ctx.notifications.unread} unread notification${ctx.notifications.unread !== 1 ? "s" : ""}**.`);
  }

  parts.push(``);
  parts.push(`Want to dive deeper into any of these?`);
  return parts.join("\n");
}

export function buildActivityAnalysis(ctx: UserContext): string {
  const recent = ctx.activities.recent;
  const dashboard = ctx.dashboard;

  if (recent.length === 0) {
    return `It looks like you haven't logged any runs yet.

Once you complete your first activity I'll automatically analyze pace, cadence, distance, weekly progress, personal records and recovery trends.

Would you like to:
• **Log today's run**
• **Import from Garmin**
• **Import from Strava**
• **Start a GPS run**`;
  }

  const totalDistance = recent.reduce((s, a) => s + a.distance, 0);
  const totalDuration = recent.reduce((s, a) => s + a.duration, 0);
  const avgPace = recent.filter((a) => a.pace > 0).length > 0
    ? recent.filter((a) => a.pace > 0).reduce((s, a) => s + a.pace, 0) / recent.filter((a) => a.pace > 0).length
    : 0;

  const thisWeek = recent.filter((a) => {
    const d = new Date(a.date);
    const weekAgo = new Date(Date.now() - 7 * 86400000);
    return d >= weekAgo;
  });

  const lastWeek = recent.filter((a) => {
    const d = new Date(a.date);
    const twoWeeksAgo = new Date(Date.now() - 14 * 86400000);
    const weekAgo = new Date(Date.now() - 7 * 86400000);
    return d >= twoWeeksAgo && d < weekAgo;
  });

  const parts: string[] = [];
  parts.push(`**Activity Analysis — ${recent.length} run${recent.length !== 1 ? "s" : ""} in your log**`);
  parts.push(``);
  parts.push(`**Overall Stats**`);
  parts.push(`- Total distance: ${d(totalDistance)}`);
  parts.push(`- Total duration: ${dur(totalDuration)}`);
  if (avgPace) parts.push(`- Average pace: ${paceStr(avgPace)}`);

  if (thisWeek.length > 0) {
    const weeklyDistance = thisWeek.reduce((s, a) => s + a.distance, 0);
    const weeklyDuration = thisWeek.reduce((s, a) => s + a.duration, 0);
    const weeklyPace = thisWeek.filter((a) => a.pace > 0).length > 0
      ? thisWeek.filter((a) => a.pace > 0).reduce((s, a) => s + a.pace, 0) / thisWeek.filter((a) => a.pace > 0).length
      : 0;
    parts.push(``);
    parts.push(`**This Week (${thisWeek.length} run${thisWeek.length !== 1 ? "s" : ""})**`);
    parts.push(`- Distance: ${d(weeklyDistance)}`);
    parts.push(`- Duration: ${dur(weeklyDuration)}`);
    if (weeklyPace) parts.push(`- Pace: ${paceStr(weeklyPace)}`);

    if (lastWeek.length > 0) {
      const lastWeekDistance = lastWeek.reduce((s, a) => s + a.distance, 0);
      const trend = lastWeekDistance > 0 ? ((weeklyDistance - lastWeekDistance) / lastWeekDistance) * 100 : 0;
      parts.push(`- Weekly trend: ${trend >= 0 ? "+" : ""}${trend.toFixed(0)}% ${trend >= 0 ? "increase" : "decrease"} vs last week`);
    }
  }

  const types = [...new Set(recent.map((a) => a.type))];
  if (types.length > 0) {
    parts.push(``);
    parts.push(`**Activity Types:** ${types.join(", ")}`);
  }

  const daysWithRuns = new Set(recent.map((a) => new Date(a.date).toDateString())).size;
  const dateRange = recent.length >= 2
    ? `${new Date(recent[recent.length - 1].date).toLocaleDateString()} — ${new Date(recent[0].date).toLocaleDateString()}`
    : "N/A";
  parts.push(`- Active days: ${daysWithRuns}`);
  parts.push(`- Date range: ${dateRange}`);

  const weeklyGoal = dashboard.goals.find((gl) => gl.period === "weekly" && gl.type === "distance");
  if (weeklyGoal) {
    const pct = weeklyGoal.target > 0 ? Math.round((dashboard.weeklyDistance / (weeklyGoal.target * 1000)) * 100) : 0;
    parts.push(``);
    parts.push(`**Goal Progress:** ${d(dashboard.weeklyDistance)} of ${d(weeklyGoal.target * 1000)} (${pct}%)`);
  }

  const strengths: string[] = [];
  if (ctx.profile.streak > 0) strengths.push(`You're on a **${ctx.profile.streak}-day streak** — impressive consistency`);
  if (ctx.activities.personalRecords.length > 0) strengths.push(`You have **${ctx.activities.personalRecords.length} personal record${ctx.activities.personalRecords.length !== 1 ? "s" : ""}**`);

  if (strengths.length > 0) {
    parts.push(``);
    parts.push(`**Highlights**`);
    for (const s of strengths) parts.push(`- ${s}`);
  }

  parts.push(``);
  parts.push(`Want me to suggest improvements or create a training plan based on this data?`);
  return parts.join("\n");
}

export function buildWeatherResponse(ctx: UserContext): string {
  const weather = ctx.weather;
  if (!weather) return "Weather data is currently unavailable.";

  const dashboard = ctx.dashboard;
  const recent = ctx.activities.recent;

  const tempOk = weather.temp >= 5 && weather.temp <= 32;
  const aqiOk = weather.aqi <= 100;

  const parts: string[] = [];
  parts.push(`**Current conditions:** ${weather.temp}°C · ${weather.condition} · AQI ${weather.aqi}${weather.aqi <= 50 ? " (good)" : weather.aqi <= 100 ? " (moderate)" : " (unhealthy)"}`);

  if (tempOk && aqiOk) {
    parts.push(`Great running weather${recent.length > 0 && dashboard.weeklyDistance > 0 ? `. You've done ${d(dashboard.weeklyDistance)} this week` : ""}.`);
    if (!dashboard.todayRuns) {
      parts.push(`You haven't run today — perfect time to get out.`);
    }
  } else if (!tempOk) {
    parts.push(weather.temp < 5
      ? "It's cold. Layer up with a thermal base layer, gloves, and a hat. Keep the run shorter than usual."
      : "It's hot. Run early or late, stay hydrated, and slow your pace by 30-60s per km.");
  } else if (!aqiOk) {
    parts.push("AQI is elevated. Consider an indoor workout or a shorter, easy-paced run if you must go out.");
  }

  return parts.join(" ");
}

export function buildEventResponse(ctx: UserContext): string {
  const events = ctx.events.upcoming;
  if (events.length === 0) {
    const parts: string[] = ["You don't have any upcoming events registered."];
    parts.push("Want me to find events near you or suggest some to check out?");
    return parts.join(" ");
  }

  const next = events[0];
  const parts: string[] = [];
  parts.push(`**${next.title}** — ${new Date(next.date).toLocaleDateString()}`);
  parts.push(`Location: ${next.location}${next.distance > 0 ? ` · ${d(next.distance)}` : ""}`);

  if (events.length > 1) {
    parts.push(``);
    parts.push(`**Other Events**`);
    for (let i = 1; i < events.length; i++) {
      parts.push(`- ${events[i].title} (${new Date(events[i].date).toLocaleDateString()})`);
    }
  }

  parts.push(``);
  parts.push(`Want to prepare with a training plan or check race logistics?`);
  return parts.join("\n");
}

export function buildCommunityResponse(ctx: UserContext): string {
  const communities = ctx.communities;
  if (communities.length === 0) {
    const parts: string[] = ["You haven't joined any communities yet."];
    parts.push("Communities are great for motivation, group runs, and meeting local runners.");
    parts.push("Would you like me to find some near you?");
    return parts.join(" ");
  }

  const parts: string[] = [];
  parts.push(`You're in **${communities.length} communit${communities.length !== 1 ? "ies" : "y"}**:`);
  for (const c of communities) {
    parts.push(`- **${c.name}** — ${c.memberCount} members · you're a ${c.role}`);
  }
  return parts.join("\n");
}

export function buildChallengeResponse(ctx: UserContext): string {
  const active = ctx.challenges.active;
  const completed = ctx.challenges.completed;

  if (active.length === 0 && completed === 0) {
    return "You haven't joined any challenges yet. Challenges are a great way to stay motivated. Want me to find some for you?";
  }

  const parts: string[] = [];
  if (active.length > 0) {
    parts.push(`**Active Challenges**`);
    for (const c of active) {
      const pct = c.target > 0 ? Math.round((c.progress / c.target) * 100) : 0;
      const deadline = new Date(c.deadline);
      const daysLeft = Math.ceil((deadline.getTime() - Date.now()) / 86400000);
      parts.push(`- **${c.title}**: ${c.progress} / ${c.target} ${c.unit} (${pct}%) · ${daysLeft > 0 ? `${daysLeft} day${daysLeft > 1 ? "s" : ""} left` : "ends today"}`);
    }
  }
  if (completed > 0) parts.push(`Completed: ${completed} challenge${completed !== 1 ? "s" : ""}`);
  return parts.join("\n");
}

export function buildRouteResponse(ctx: UserContext): string {
  const saved = ctx.savedItems.routes;
  const parts: string[] = [];

  if (saved > 0) {
    parts.push(`You have **${saved} saved route${saved !== 1 ? "s" : ""}**.`);
  }

  const recentRuns = ctx.activities.recent.filter((a) => a.distance > 0);
  if (recentRuns.length > 0) {
    const avgDist = recentRuns.reduce((s, a) => s + a.distance, 0) / recentRuns.length;
    parts.push(`Based on your recent runs (avg ${d(avgDist)}), here are some recommendations:`);
  }

  parts.push(`- **Neighborhood loop**: Start from your location, easy 5K`);
  parts.push(`- **Park trail**: Gentle terrain, good for recovery runs`);
  parts.push(`- **Hill route**: Build strength with gradual inclines`);

  parts.push(``);
  parts.push("Want me to save a route or navigate to one?");
  return parts.join("\n");
}

export function buildImprovePerformanceResponse(ctx: UserContext): string {
  const recent = ctx.activities.recent;
  const dashboard = ctx.dashboard;
  const profile = ctx.profile;

  if (recent.length === 0) {
    return "To help you improve, I need some data first. Log a few runs and I'll analyze your patterns and suggest specific improvements.";
  }

  const fastest = recent.filter((a) => a.pace > 0).reduce((best, a) => (a.pace < best.pace ? a : best), recent[0]);
  const avgPace = recent.filter((a) => a.pace > 0).length > 0
    ? recent.filter((a) => a.pace > 0).reduce((s, a) => s + a.pace, 0) / recent.filter((a) => a.pace > 0).length
    : 0;

  const parts: string[] = [];
  parts.push(`**Performance Analysis**`);
  parts.push(`- Current avg pace: ${paceStr(avgPace)}`);
  if (fastest) parts.push(`- Best pace: ${paceStr(fastest.pace)}`);
  parts.push(`- Weekly volume: ${d(dashboard.weeklyDistance)}`);
  parts.push(`- Total runs: ${profile.totalRuns}`);
  parts.push(``);

  parts.push(`**To improve your pace, focus on:**`);
  parts.push(`1. **Consistency**: 3-4 runs per week, even if short`);
  parts.push(`2. **Tempo runs**: 20 min at \"comfortably hard\" effort once a week`);
  parts.push(`3. **Intervals**: 400m-1K repeats at target pace`);
  parts.push(`4. **Strength**: 2x/week bodyweight circuits`);

  if (avgPace > 360) {
    parts.push(``);
    parts.push(`At your current pace, a realistic 5K goal is **${paceStr(avgPace - 15)}** within 4-6 weeks with consistent training.`);
  }

  return parts.join("\n");
}

export function buildGeneralResponse(ctx: UserContext, message: string): string {
  const dashboard = ctx.dashboard;
  const profile = ctx.profile;

  const parts: string[] = [`I see you're asking about "${message.slice(0, 50)}".`];
  if (dashboard.weeklyDistance > 0) {
    parts.push(`Here's what I know: **${d(dashboard.weeklyDistance)}** this week, level **${profile.level}**, **${profile.streak}-day streak**.`);
  } else {
    parts.push(`You haven't logged any runs yet this week. I'm here to help whenever you're ready.`);
  }
  parts.push(`What specific area would you like to explore? (training, events, communities, routes, or progress)`);
  return parts.join(" ");
}

export function buildRecommendationResponse(ctx: UserContext): string {
  const parts: string[] = ["Based on your profile, here's what I'd recommend:"];
  parts.push(``);

  if (ctx.dashboard.weeklyDistance === 0) {
    parts.push(`**Start with a 20-minute easy run** — just get moving.`);
  } else if (ctx.dashboard.weeklyDistance < 15000) {
    parts.push(`**Increase weekly volume gradually** — add 10% per week.`);
    parts.push(`**Try a local park loop** for a change of scenery.`);
  } else {
    parts.push(`**You're building good mileage.** Consider adding one speed session per week.`);
    parts.push(`**Check out** your communities for group runs.`);
  }

  if (ctx.events.upcoming.length > 0) {
    parts.push(`**Prepare for ${ctx.events.upcoming[0].title}** on ${new Date(ctx.events.upcoming[0].date).toLocaleDateString()}.`);
  }

  parts.push(``);
  parts.push(`Want me to dive deeper into any of these?`);
  return parts.join("\n");
}

export function buildTrainingPlanResponse(ctx: UserContext): string {
  if (ctx.activities.recent.length === 0) {
    return "To create a personalized plan, I need some data first. Log a few runs and tell me your goal (5K, 10K, half marathon, etc.).";
  }
  return `Let me create a training plan for you. First, tell me:
1. What's your **goal distance**? (5K, 10K, half marathon, marathon)
2. How many **days per week** can you run?
3. Do you have a **target date** in mind?

Based on your current data (${d(ctx.dashboard.weeklyDistance)}/week), I'll tailor it to your level.`;
}

export function detectIntentAndBuildResponse(
  ctx: UserContext,
  message: string,
  _recentAssistantMessages: string[]
): { intent: Intent; response: string; useLLM: boolean; llmContext?: string } {
  const { intent } = classifyIntent(message);

  switch (intent) {
    case "greeting":
      return { intent, response: buildGreeting(ctx), useLLM: false };

    case "dashboard_summary":
      return { intent, response: buildDashboardSummary(ctx), useLLM: false };

    case "activity_analysis":
      return { intent, response: buildActivityAnalysis(ctx), useLLM: false };

    case "weather":
      return { intent, response: buildWeatherResponse(ctx), useLLM: false };

    case "upcoming_events":
      return { intent, response: buildEventResponse(ctx), useLLM: false };

    case "nearby_communities":
      return { intent, response: buildCommunityResponse(ctx), useLLM: false };

    case "challenges":
      return { intent, response: buildChallengeResponse(ctx), useLLM: false };

    case "route_recommendation":
      return { intent, response: buildRouteResponse(ctx), useLLM: false };

    case "improve_performance":
      return { intent, response: buildImprovePerformanceResponse(ctx), useLLM: false };

    case "training_plan":
      return { intent, response: buildTrainingPlanResponse(ctx), useLLM: false };

    case "recommendation":
      return { intent, response: buildRecommendationResponse(ctx), useLLM: false };

    case "general":
    default: {
      return {
        intent,
        response: buildGeneralResponse(ctx, message),
        useLLM: false,
      };
    }
  }
}
