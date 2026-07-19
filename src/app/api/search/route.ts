import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");

  if (!q || q.length < 1) {
    return NextResponse.json({ users: [], events: [], clubs: [] });
  }

  const supabase = await createServerSupabaseClient();
  const query = `%${q}%`;

  const [{ data: users }, { data: events }, { data: clubs }, { data: activities }, { data: challenges }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, name, username, avatar, bio, location")
      .or(`name.ilike.${query},username.ilike.${query}`)
      .limit(10),
    supabase
      .from("events")
      .select("id, title, date, location, type, registered_count, max_participants")
      .or(`title.ilike.${query},location.ilike.${query}`)
      .limit(10),
    supabase
      .from("clubs")
      .select("id, name, avatar, location, category, member_count")
      .or(`name.ilike.${query},location.ilike.${query},description.ilike.${query}`)
      .limit(10),
    supabase
      .from("activities")
      .select("id, title, type, distance, duration, created_at")
      .or(`title.ilike.${query},type.ilike.${query}`)
      .limit(10),
    supabase
      .from("challenges")
      .select("id, title, type, difficulty, target, end_date")
      .or(`title.ilike.${query},type.ilike.${query}`)
      .limit(10),
  ]);

  return NextResponse.json({
    users: (users || []).map((u) => ({
      id: u.id,
      name: u.name,
      username: u.username,
      avatar: u.avatar || "",
      bio: u.bio || "",
      location: u.location || "",
    })),
    events: (events || []).map((e) => ({
      id: e.id,
      title: e.title,
      date: e.date,
      location: e.location,
      type: e.type,
      registeredCount: e.registered_count,
      maxParticipants: e.max_participants,
    })),
    clubs: (clubs || []).map((c) => ({
      id: c.id,
      name: c.name,
      avatar: c.avatar || "",
      location: c.location || "",
      category: c.category,
      memberCount: c.member_count,
    })),
    activities: (activities || []).map((a) => ({
      id: a.id,
      title: a.title || "Untitled Activity",
      type: a.type,
      distance: a.distance,
      duration: a.duration,
      createdAt: a.created_at,
    })),
    challenges: (challenges || []).map((ch) => ({
      id: ch.id,
      title: ch.title,
      type: ch.type,
      difficulty: ch.difficulty,
      target: ch.target,
      endDate: ch.end_date,
    })),
  });
}
