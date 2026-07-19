import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { rateLimitMiddleware } from "@/lib/rate-limit";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const rateCheck = rateLimitMiddleware(user?.id || "anon", "route-stats", 60);
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { data: stats, error } = await supabase
    .from("route_statistics")
    .select("*")
    .eq("route_id", id)
    .single();

  if (error) {
    const { error: routeError } = await supabase
      .from("routes")
      .select("id")
      .eq("id", id)
      .single();

    if (routeError) {
      return NextResponse.json({ error: "Route not found" }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        id: null,
        routeId: id,
        totalRuns: 0,
        uniqueRunners: 0,
        averagePace: 0,
        fastestTime: 0,
        longestDistance: 0,
        averageRating: 0,
        reviewCount: 0,
        communityScore: 0,
        photoCount: 0,
        bookmarkCount: 0,
        likeCount: 0,
      },
    });
  }

  return NextResponse.json({
    data: {
      id: stats.id,
      routeId: stats.route_id,
      totalRuns: stats.total_runs,
      uniqueRunners: stats.unique_runners,
      averagePace: stats.average_pace,
      fastestTime: stats.fastest_time,
      longestDistance: stats.longest_distance,
      averageRating: stats.average_rating,
      reviewCount: stats.review_count,
      communityScore: stats.community_score,
      photoCount: stats.photo_count,
      bookmarkCount: stats.bookmark_count,
      likeCount: stats.like_count,
    },
  });
}
