import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { rateLimitMiddleware } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get("lat") || "0");
  const lng = parseFloat(searchParams.get("lng") || "0");

  if (!lat || !lng) {
    return NextResponse.json({ error: "lat and lng required" }, { status: 400 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const rateCheck = rateLimitMiddleware(user?.id || "anon", "safety", 60);
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { data: safetyRecords, error } = await supabase
    .from("safety_data")
    .select("*")
    .order("recorded_at", { ascending: false })
    .limit(5);

  const latestRecord = safetyRecords?.[0];

  if (!latestRecord || error) {
    return NextResponse.json({
      data: {
        aqi: 42,
        uvIndex: 5,
        humidity: 65,
        temperature: 28,
        rainChance: 10,
        windSpeed: 12,
        weatherCondition: "partly_cloudy",
        trafficLevel: "moderate",
        roadSafetyRating: 3,
        streetLightingRating: 3,
        crowdDensity: "moderate",
        emergencyContacts: [
          { name: "Police", phone: "100" },
          { name: "Ambulance", phone: "108" },
          { name: "Fire", phone: "101" },
        ],
        nearbyHospitals: [],
        note: "Estimated defaults — no real-time data available for this location",
      },
    });
  }

  return NextResponse.json({
    data: {
      aqi: latestRecord.aqi ?? 42,
      uvIndex: latestRecord.uv_index ?? 5,
      humidity: latestRecord.humidity ?? 65,
      temperature: latestRecord.temperature ?? 28,
      rainChance: latestRecord.rain_chance ?? 10,
      windSpeed: latestRecord.wind_speed ?? 12,
      weatherCondition: latestRecord.weather_condition ?? "partly_cloudy",
      trafficLevel: latestRecord.traffic_level ?? "moderate",
      roadSafetyRating: latestRecord.road_safety_rating ?? 3,
      streetLightingRating: latestRecord.street_lighting_rating ?? 3,
      crowdDensity: latestRecord.crowd_density ?? "moderate",
      emergencyContacts: latestRecord.emergency_contacts ?? [
        { name: "Police", phone: "100" },
        { name: "Ambulance", phone: "108" },
      ],
      nearbyHospitals: latestRecord.nearby_hospitals ?? [],
    },
  });
}
