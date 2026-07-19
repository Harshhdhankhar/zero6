import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/auth/welcome";

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Check if this is a new user by checking their profile creation time
      if (data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("created_at")
          .eq("id", data.user.id)
          .single();

        // If profile was created very recently (within last minute), it's likely a new user
        const isNewUser = profile && 
          new Date(profile.created_at).getTime() > Date.now() - 60000;

        if (isNewUser && next === "/auth/welcome") {
          return NextResponse.redirect(`${origin}/auth/welcome`);
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
