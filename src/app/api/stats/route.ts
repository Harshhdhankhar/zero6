import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const todayStart = startOfDay(now);
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 6);

  const monthStart = new Date(todayStart);
  monthStart.setDate(monthStart.getDate() - 27);

  const { data: activities, error } = await supabase
    .from("activities")
    .select("distance, duration, pace, created_at")
    .eq("user_id", user.id)
    .gte("created_at", monthStart.toISOString())
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = activities || [];

  const todayDistance = rows
    .filter((a) => new Date(a.created_at) >= todayStart)
    .reduce((sum, a) => sum + (a.distance || 0), 0);

  const weekRows = rows.filter((a) => new Date(a.created_at) >= weekStart);
  const weeklyDistance = weekRows.reduce((sum, a) => sum + (a.distance || 0), 0);
  const weeklyDuration = weekRows.reduce((sum, a) => sum + (a.duration || 0), 0);
  const weeklyRuns = weekRows.length;

  const paces = weekRows.filter((a) => a.pace > 0).map((a) => a.pace);
  const avgPace =
    paces.length > 0 ? Math.round(paces.reduce((s, p) => s + p, 0) / paces.length) : 0;
  const bestPace = paces.length > 0 ? Math.min(...paces) : 0;

  const monthlyDistance = rows.reduce((sum, a) => sum + (a.distance || 0), 0);

  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(weekStart);
    day.setDate(day.getDate() + i);
    const nextDay = new Date(day);
    nextDay.setDate(nextDay.getDate() + 1);

    const dayRows = weekRows.filter((a) => {
      const d = new Date(a.created_at);
      return d >= day && d < nextDay;
    });

    return {
      day: DAY_LABELS[day.getDay()],
      distance: dayRows.reduce((sum, a) => sum + (a.distance || 0), 0),
      duration: dayRows.reduce((sum, a) => sum + (a.duration || 0), 0),
      runs: dayRows.length,
    };
  });

  const monthlyData = Array.from({ length: 4 }, (_, i) => {
    const weekStartDate = new Date(monthStart);
    weekStartDate.setDate(weekStartDate.getDate() + i * 7);
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 7);

    const weekRowsMonth = rows.filter((a) => {
      const d = new Date(a.created_at);
      return d >= weekStartDate && d < weekEndDate;
    });

    return {
      week: `W${i + 1}`,
      distance: weekRowsMonth.reduce((sum, a) => sum + (a.distance || 0), 0),
      duration: weekRowsMonth.reduce((sum, a) => sum + (a.duration || 0), 0),
      runs: weekRowsMonth.length,
    };
  });

  return NextResponse.json({
    data: {
      todayDistance,
      dailyTarget: 8000,
      weeklyDistance,
      weeklyRuns,
      weeklyDuration,
      monthlyDistance,
      avgPace,
      bestPace,
      weeklyData,
      monthlyData,
    },
  });
}
