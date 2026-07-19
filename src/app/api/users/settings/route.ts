import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimitMiddleware } from "@/lib/rate-limit";

const notificationPreferencesSchema = z.object({
  likes: z.boolean().optional(),
  comments: z.boolean().optional(),
  follows: z.boolean().optional(),
  challenges: z.boolean().optional(),
});

const privacySchema = z.object({
  showDistance: z.boolean().optional(),
  showMap: z.boolean().optional(),
  showHeartRate: z.boolean().optional(),
});

const preferencesSchema = z.object({
  preferences: z.object({
    units: z.enum(["metric", "imperial"]).optional(),
    notificationPreferences: notificationPreferencesSchema.optional(),
    privacy: privacySchema.optional(),
  }),
});

export async function PATCH(request: Request) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateCheck = rateLimitMiddleware(user.id, "updateSettings", 20);
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await request.json();
  const parsed = preferencesSchema.safeParse(body);
  if (!parsed.success) {
    const details = parsed.error.issues.map((i) => ({
      field: i.path.join("."),
      message: i.message,
    }));
    return NextResponse.json({ error: "Validation failed", details }, { status: 400 });
  }

  // Merge with existing preferences to avoid overwriting
  const { data: existing } = await supabase
    .from("profiles")
    .select("preferences")
    .eq("id", user.id)
    .single();

  const existingPrefs = (existing?.preferences as Record<string, unknown>) || {};
  const newPrefs = parsed.data.preferences as Record<string, unknown>;

  const merged: Record<string, unknown> = { ...existingPrefs };
  for (const [key, value] of Object.entries(newPrefs)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      merged[key] = {
        ...((existingPrefs[key] as Record<string, unknown>) || {}),
        ...(value as Record<string, unknown>),
      };
    } else if (value !== undefined) {
      merged[key] = value;
    }
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ preferences: merged })
    .eq("id", user.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ data: { preferences: merged } });
}
