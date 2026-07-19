import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/* ──────────────────────────────────────────────────────────────────
   Fallback seed data — used when the Supabase RPC function
   `get_leaderboard` is not yet deployed or the database is empty.
   ────────────────────────────────────────────────────────────────── */
const SEED_LEADERBOARD = [
  { rank: 1, user_id: "u1", name: "Arjun Mehta",     avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Arjun",   value: 312.4, unit: "km", change: 2  },
  { rank: 2, user_id: "u2", name: "Priya Sharma",    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Priya",   value: 287.1, unit: "km", change: 0  },
  { rank: 3, user_id: "u3", name: "Ravi Krishnan",   avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Ravi",    value: 264.9, unit: "km", change: 1  },
  { rank: 4, user_id: "u4", name: "Sneha Desai",     avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Sneha",   value: 241.3, unit: "km", change: -1 },
  { rank: 5, user_id: "u5", name: "Vikram Singh",    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Vikram",  value: 218.7, unit: "km", change: 3  },
  { rank: 6, user_id: "u6", name: "Ananya Iyer",     avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Ananya",  value: 196.2, unit: "km", change: 0  },
  { rank: 7, user_id: "u7", name: "Karan Patel",     avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Karan",   value: 184.5, unit: "km", change: -2 },
  { rank: 8, user_id: "u8", name: "Meera Nair",      avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Meera",   value: 171.8, unit: "km", change: 1  },
  { rank: 9, user_id: "u9", name: "Aditya Joshi",    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Aditya",  value: 159.3, unit: "km", change: 0  },
  { rank: 10,user_id: "u10",name: "Divya Reddy",     avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Divya",   value: 147.6, unit: "km", change: 2  },
];

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || "all";
  const category = searchParams.get("type") || "distance";
  const limit = parseInt(searchParams.get("limit") || "50", 10);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const validCategories = ["distance", "runs", "duration", "streak", "elevation", "xp"];
  const validPeriods = ["week", "month", "year", "all"];

  const safeCategory = validCategories.includes(category) ? category : "distance";
  const safePeriod = validPeriods.includes(period) ? period : "all";

  // Try Supabase RPC first, fall back to seed data
  const { data: leaderboard, error } = await supabase.rpc("get_leaderboard", {
    p_period: safePeriod,
    p_category: safeCategory,
    p_limit: Math.min(limit, 100),
    p_user_id: user?.id || null,
  });

  const entries = error || !leaderboard?.length ? SEED_LEADERBOARD : leaderboard;

  const unitLabels: Record<string, string> = {
    distance: "km",
    runs: "runs",
    duration: "min",
    streak: "days",
    elevation: "m",
    xp: "xp",
  };

  const formatted = entries.slice(0, limit).map((entry: any, i: number) => ({
    rank: entry.rank ?? i + 1,
    userId: entry.user_id,
    name: entry.name || "Anonymous",
    avatar: entry.avatar || "",
    value: Math.round((entry.value || 0) * 10) / 10,
    unit: entry.unit || unitLabels[safeCategory] || "",
    change: entry.change || 0,
    isCurrentUser: user?.id === entry.user_id,
  }));

  return NextResponse.json({
    data: formatted,
    meta: { period: safePeriod, category: safeCategory, isSeed: !!error },
  });
}
