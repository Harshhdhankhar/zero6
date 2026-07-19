import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { validateBody, markAllNotificationsReadSchema } from "@/lib/validations";
import { rateLimitMiddleware } from "@/lib/rate-limit";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: notifications, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("receiver_id", user.id)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const unread = (notifications || []).filter((n: any) => !n.is_read).length;

  const formatted = (notifications || []).map((n: any) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    avatar: n.avatar,
    isRead: n.is_read,
    actionUrl: n.action_url,
    createdAt: n.created_at,
  }));

  return NextResponse.json({
    data: formatted,
    meta: { total: formatted.length, unread },
  });
}

export async function PUT(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateCheck = rateLimitMiddleware(user.id, "markNotificationRead");
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await request.json();

  if (body.markAll) {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("receiver_id", user.id)
      .eq("is_read", false);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "All notifications marked as read" });
  }

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", body.id)
    .eq("receiver_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Notification marked as read" });
}
