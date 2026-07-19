import type { UserContext } from "./types";

function formatDistance(meters: number): string {
  return meters >= 1000 ? `${(meters / 1000).toFixed(2)} km` : `${Math.round(meters)} m`;
}

export async function gatherContext(supabase: any, userId: string): Promise<UserContext> {
  const today = new Date().toISOString().split("T")[0];
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString();

  const [
    profileRes,
    todayActRes,
    weekActRes,
    monthActRes,
    goalsRes,
    recentActRes,
    communitiesRes,
    eventsRes,
    challengesRes,
    notificationsRes,
    weatherRes,
    savedItemsRes,
    prRes,
  ] = await Promise.allSettled([
    supabase.from("profiles").select("*").eq("id", userId).single(),
    supabase.from("activities").select("distance, duration").eq("user_id", userId).gte("created_at", today),
    supabase.from("activities").select("distance, duration").eq("user_id", userId).gte("created_at", weekAgo),
    supabase.from("activities").select("distance, duration, pace").eq("user_id", userId).gte("created_at", monthAgo),
    supabase.from("user_goals").select("*").eq("user_id", userId).eq("is_active", true),
    supabase.from("activities").select("title, distance, duration, pace, created_at, type").eq("user_id", userId).order("created_at", { ascending: false }).limit(5),
    supabase.from("club_members").select("clubs!inner(id, name, member_count), role").eq("user_id", userId),
    supabase.from("event_registrations").select("events!inner(id, title, date, location, type, distance)").eq("user_id", userId).gte("events.date", today).order("events.date", { ascending: true }).limit(5),
    supabase.from("challenge_participants").select("challenges!inner(id, title, type, target, unit, end_date), current").eq("user_id", userId),
    supabase.from("notifications").select("title, message, created_at").eq("receiver_id", userId).eq("is_read", false).order("created_at", { ascending: false }).limit(5),
    supabase.rpc("get_current_weather").maybeSingle(),
    supabase.from("saved_items").select("item_type").eq("user_id", userId),
    supabase.from("activities").select("pace").eq("user_id", userId).not("pace", "is", null).order("pace", { ascending: true }).limit(1),
  ]);

  const profile = profileRes.status === "fulfilled" ? profileRes.value.data : null;
  const todayActs = todayActRes.status === "fulfilled" ? todayActRes.value.data || [] : [];
  const weekActs = weekActRes.status === "fulfilled" ? weekActRes.value.data || [] : [];
  const monthActs = monthActRes.status === "fulfilled" ? monthActRes.value.data || [] : [];
  const goals = goalsRes.status === "fulfilled" ? goalsRes.value.data || [] : [];
  const recentActs = recentActRes.status === "fulfilled" ? recentActRes.value.data || [] : [];
  const communitiesData = communitiesRes.status === "fulfilled" ? communitiesRes.value.data || [] : [];
  const eventsData = eventsRes.status === "fulfilled" ? eventsRes.value.data || [] : [];
  const challengesData = challengesRes.status === "fulfilled" ? challengesRes.value.data || [] : [];
  const notifs = notificationsRes.status === "fulfilled" ? notificationsRes.value.data || [] : [];
  const weather = weatherRes.status === "fulfilled" ? weatherRes.value.data : null;
  const savedItems = savedItemsRes.status === "fulfilled" ? savedItemsRes.value.data || [] : [];
  const bestPaceRow = prRes.status === "fulfilled" ? prRes.value.data : null;

  const todayDistance = todayActs.reduce((s: number, a: any) => s + (a.distance || 0), 0);
  const todayDuration = todayActs.reduce((s: number, a: any) => s + (a.duration || 0), 0);
  const weekDistance = weekActs.reduce((s: number, a: any) => s + (a.distance || 0), 0);
  const weekDuration = weekActs.reduce((s: number, a: any) => s + (a.duration || 0), 0);
  const monthDistance = monthActs.reduce((s: number, a: any) => s + (a.distance || 0), 0);

  const avgPace = monthActs.length > 0
    ? monthActs.reduce((s: number, a: any) => s + (a.pace || 0), 0) / monthActs.length
    : 0;

  const prs: { label: string; value: string }[] = [];
  if (profile?.total_runs > 0) {
    if (bestPaceRow?.pace) {
      const p = bestPaceRow.pace;
      prs.push({ label: "Best Pace", value: `${Math.floor(p / 60)}:${String(Math.round(p % 60)).padStart(2, "0")} /km` });
    }
    prs.push({ label: "Total Distance", value: formatDistance(profile.total_distance) });
    prs.push({ label: "Total Runs", value: String(profile.total_runs) });
  }

  const bookmarkedRoutes = savedItems.filter((s: any) => s.item_type === "route").length;
  const bookmarkedEvents = savedItems.filter((s: any) => s.item_type === "event").length;

  return {
    profile: {
      id: userId,
      name: profile?.name || "Runner",
      username: profile?.username || "runner",
      level: profile?.level || 1,
      xp: profile?.xp || 0,
      xpToNextLevel: profile?.xp_to_next_level || 1000,
      streak: profile?.current_streak || 0,
      totalDistance: profile?.total_distance || 0,
      totalRuns: profile?.total_runs || 0,
      totalDuration: profile?.total_duration || 0,
    },
    dashboard: {
      todayDistance,
      todayDuration,
      todayRuns: todayActs.length,
      weeklyDistance: weekDistance,
      weeklyDuration: weekDuration,
      weeklyRuns: weekActs.length,
      monthlyDistance: monthDistance,
      monthlyRuns: monthActs.length,
      avgPace,
      goals: goals.map((g: any) => ({
        id: g.id,
        type: g.type,
        target: g.target,
        current: g.current || 0,
        unit: g.unit,
        period: g.period,
        title: g.title || "",
      })),
    },
    activities: {
      recent: recentActs.map((a: any) => ({
        id: a.id,
        title: a.title || "Run",
        distance: a.distance || 0,
        duration: a.duration || 0,
        pace: a.pace || 0,
        date: a.created_at,
        type: a.type || "run",
      })),
      personalRecords: prs,
    },
    communities: communitiesData.map((c: any) => ({
      id: c.clubs?.id || "",
      name: c.clubs?.name || "",
      role: c.role,
      memberCount: c.clubs?.member_count || 0,
    })),
    events: {
      upcoming: eventsData.map((e: any) => ({
        id: e.events?.id || "",
        title: e.events?.title || "",
        date: e.events?.date || "",
        location: e.events?.location || "",
        type: e.events?.type || "",
        distance: e.events?.distance || 0,
      })),
      registered: eventsData.length,
    },
    challenges: {
      active: challengesData.map((c: any) => ({
        id: c.challenges?.id || "",
        title: c.challenges?.title || "",
        type: c.challenges?.type || "",
        progress: c.current || 0,
        target: c.challenges?.target || 0,
        unit: c.challenges?.unit || "",
        deadline: c.challenges?.end_date || "",
      })),
      completed: challengesData.filter((c: any) => c.current >= (c.challenges?.target || 0)).length,
    },
    rewards: {
      xp: profile?.xp || 0,
      level: profile?.level || 1,
      coins: profile?.coins || 0,
      badges: profile?.badges || 0,
    },
    notifications: {
      unread: notifs.length,
      recent: notifs.slice(0, 3).map((n: any) => ({ title: n.title || "", message: n.message || "" })),
    },
    weather: weather
      ? { temp: weather.temp || 25, condition: weather.condition || "clear", aqi: weather.aqi || 50 }
      : null,
    memory: {
      conversationsCount: 0,
      recentTopics: [],
      preferences: {},
    },
    savedItems: {
      routes: bookmarkedRoutes,
      events: bookmarkedEvents,
    },
  };
}
