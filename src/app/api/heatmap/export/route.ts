import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: waypoints, error } = await supabase
    .from("heatmap_waypoints")
    .select("id, latitude, longitude, altitude, speed, recorded_at")
    .eq("user_id", user.id)
    .order("recorded_at", { ascending: false })
    .limit(10000);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const features = (waypoints || []).map((wp) => ({
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [wp.longitude, wp.latitude, wp.altitude || 0],
    },
    properties: {
      id: wp.id,
      speed: wp.speed,
      recorded_at: wp.recorded_at,
    },
  }));

  const geojson = {
    type: "FeatureCollection",
    features,
  };

  return new NextResponse(JSON.stringify(geojson), {
    status: 200,
    headers: {
      "Content-Type": "application/geo+json",
      "Content-Disposition": `attachment; filename="zero6-heatmap-${user.id.slice(0, 8)}.geojson"`,
    },
  });
}
