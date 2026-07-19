import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { rateLimitMiddleware } from "@/lib/rate-limit";

const INDIAN_CITIES = [
  { name: "Delhi", state: "Delhi", lat: 28.7041, lng: 77.1025 },
  { name: "Mumbai", state: "Maharashtra", lat: 19.0760, lng: 72.8777 },
  { name: "Bangalore", state: "Karnataka", lat: 12.9716, lng: 77.5946 },
  { name: "Bengaluru", state: "Karnataka", lat: 12.9716, lng: 77.5946 },
  { name: "Hyderabad", state: "Telangana", lat: 17.3850, lng: 78.4867 },
  { name: "Chennai", state: "Tamil Nadu", lat: 13.0827, lng: 80.2707 },
  { name: "Kolkata", state: "West Bengal", lat: 22.5726, lng: 88.3639 },
  { name: "Pune", state: "Maharashtra", lat: 18.5204, lng: 73.8567 },
  { name: "Ahmedabad", state: "Gujarat", lat: 23.0225, lng: 72.5714 },
  { name: "Jaipur", state: "Rajasthan", lat: 26.9124, lng: 75.7873 },
  { name: "Chandigarh", state: "Chandigarh", lat: 30.7333, lng: 76.7794 },
  { name: "Goa", state: "Goa", lat: 15.4909, lng: 73.8278 },
  { name: "Lucknow", state: "Uttar Pradesh", lat: 26.8467, lng: 80.9462 },
  { name: "Surat", state: "Gujarat", lat: 21.1702, lng: 72.8311 },
];

function tryParseCoordinates(q: string): { lat: number; lng: number } | null {
  const coordMatch = q.match(/^(-?\d+(?:\.\d+)?)\s*[,;\s]\s*(-?\d+(?:\.\d+)?)$/);
  if (coordMatch) {
    const lat = parseFloat(coordMatch[1]);
    const lng = parseFloat(coordMatch[2]);
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat, lng };
    }
  }
  return null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");

  if (!q || q.trim().length === 0) {
    return NextResponse.json({ places: [], routes: [], clubs: [], events: [], cities: [] });
  }

  const trimmedQuery = q.trim();

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userId = user?.id || "anonymous";
  const rateCheck = rateLimitMiddleware(userId, "mapSearch", 60, 60000);
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const query = `%${trimmedQuery}%`;

  // Check for coordinates
  const coords = tryParseCoordinates(trimmedQuery);

  // Search cities
  const matchedCities = INDIAN_CITIES.filter(
    (c) =>
      c.name.toLowerCase().includes(trimmedQuery.toLowerCase()) ||
      c.state.toLowerCase().includes(trimmedQuery.toLowerCase())
  ).map((c) => ({
    id: `city-${c.name.toLowerCase()}`,
    name: c.name,
    description: `${c.state}, India`,
    latitude: c.lat,
    longitude: c.lng,
    type: "cities",
    subtitle: c.state,
  }));

  const [spotsResult, routesResult, clubsResult, eventsResult] =
    await Promise.allSettled([
      supabase
        .from("running_spots")
        .select("id, name, description, city, latitude, longitude, spot_type")
        .or(`name.ilike.${query},city.ilike.${query}`)
        .limit(5),

      supabase
        .from("routes")
        .select("id, title, description, city, geometry, difficulty")
        .or(`title.ilike.${query},city.ilike.${query}`)
        .limit(5),

      supabase
        .from("clubs")
        .select("id, name, description, city, location, avatar")
        .or(`name.ilike.${query},city.ilike.${query}`)
        .limit(5),

      supabase
        .from("events")
        .select("id, title, description, city, location, type")
        .or(`title.ilike.${query},city.ilike.${query}`)
        .limit(5),
    ]);

  const places = spotsResult.status === "fulfilled"
    ? (spotsResult.value.data || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        description: s.description || "",
        latitude: s.latitude || 20.5937,
        longitude: s.longitude || 78.9629,
        type: "places",
        subtitle: `${s.city || ""}${s.spot_type ? ` · ${s.spot_type}` : ""}`,
      }))
    : [];

  const routes = routesResult.status === "fulfilled"
    ? (routesResult.value.data || []).map((r: any) => {
        let lat = 20.5937;
        let lng = 78.9629;
        const geom = r.geometry;
        if (geom && Array.isArray(geom) && geom.length > 0) {
          const first = geom[0];
          if (first && typeof first.lat === "number" && typeof first.lng === "number") {
            lat = first.lat;
            lng = first.lng;
          }
        }
        return {
          id: r.id,
          name: r.title,
          description: r.description || "",
          latitude: lat,
          longitude: lng,
          type: "routes",
          subtitle: `${r.city || ""}${r.difficulty ? ` · ${r.difficulty}` : ""}`,
        };
      })
    : [];

  const clubs = clubsResult.status === "fulfilled"
    ? (clubsResult.value.data || [])
        .filter((c: any) => c.latitude && c.longitude)
        .map((c: any) => ({
          id: c.id,
          name: c.name,
          description: c.description || "",
          latitude: c.latitude,
          longitude: c.longitude,
          type: "clubs",
          subtitle: c.city || c.location || "",
        }))
    : [];

  const events = eventsResult.status === "fulfilled"
    ? (eventsResult.value.data || [])
        .filter((e: any) => e.latitude && e.longitude)
        .map((e: any) => ({
          id: e.id,
          name: e.title,
          description: e.description || "",
          latitude: e.latitude,
          longitude: e.longitude,
          type: "events",
          subtitle: `${e.city || e.location || ""} · ${(e.type || "").replace("_", " ")}`,
        }))
    : [];

  // If coordinates were entered, add a coordinate result
  if (coords) {
    places.unshift({
      id: "coord-search",
      name: `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`,
      description: "Search at these coordinates",
      latitude: coords.lat,
      longitude: coords.lng,
      type: "places",
      subtitle: "Coordinates",
    });
  }

  // If a city was matched, add city results
  if (matchedCities.length > 0) {
    places.unshift(...matchedCities.map((c) => ({
      id: c.id,
      name: c.name,
      description: `City in ${c.subtitle}`,
      latitude: c.latitude,
      longitude: c.longitude,
      type: "cities",
      subtitle: c.subtitle,
    })));
  }

  return NextResponse.json({ places, routes, clubs, events, cities: matchedCities });
}
