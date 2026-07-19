-- ============================================================
-- ZERO6 Premium Running Areas System
-- Enhances running_spots table with premium features
-- Adds related tables for routes, communities, events, reviews, gallery
-- ============================================================

-- ============================================================
-- Part 1: Enhance running_spots table
-- ============================================================

ALTER TABLE running_spots
  ADD COLUMN IF NOT EXISTS safety_score DOUBLE PRECISION DEFAULT 0,
  ADD COLUMN IF NOT EXISTS average_daily_runners INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS surface_type TEXT CHECK (surface_type IN ('road', 'trail', 'track', 'mixed')),
  ADD COLUMN IF NOT EXISTS difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  ADD COLUMN IF NOT EXISTS terrain TEXT CHECK (terrain IN ('flat', 'rolling', 'hilly')),
  ADD COLUMN IF NOT EXISTS loop_distance DOUBLE PRECISION DEFAULT 0,
  ADD COLUMN IF NOT EXISTS estimated_time INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS open_hours TEXT,
  ADD COLUMN IF NOT EXISTS entry_fee TEXT,
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS ai_recommendation TEXT,
  ADD COLUMN IF NOT EXISTS women_safety_rating DOUBLE PRECISION DEFAULT 0,
  ADD COLUMN IF NOT EXISTS crowd_level TEXT CHECK (crowd_level IN ('low', 'moderate', 'high')),
  ADD COLUMN IF NOT EXISTS peak_hours JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS live_runners INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS today_visits INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS most_active_time TEXT,
  ADD COLUMN IF NOT EXISTS morning_crowd TEXT,
  ADD COLUMN IF NOT EXISTS evening_crowd TEXT;

-- Update spot_type enum to include more types
ALTER TABLE running_spots
  DROP CONSTRAINT IF EXISTS running_spots_spot_type_check;

ALTER TABLE running_spots
  ADD CONSTRAINT running_spots_spot_type_check 
  CHECK (spot_type IN ('park', 'track', 'trail', 'waterfront', 'stadium', 'neighborhood', 'forest', 'beach', 'hill', 'greenway', 'campus', 'promenade'));

-- ============================================================
-- Part 2: Running Area Routes
-- ============================================================

CREATE TABLE IF NOT EXISTS running_area_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spot_id UUID REFERENCES running_spots(id) ON DELETE CASCADE NOT NULL,
  route_id UUID REFERENCES routes(id) ON DELETE CASCADE NOT NULL,
  is_popular BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(spot_id, route_id)
);

-- ============================================================
-- Part 3: Running Area Communities
-- ============================================================

CREATE TABLE IF NOT EXISTS running_area_communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spot_id UUID REFERENCES running_spots(id) ON DELETE CASCADE NOT NULL,
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE NOT NULL,
  member_count INTEGER DEFAULT 0,
  next_meetup TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(spot_id, club_id)
);

-- ============================================================
-- Part 4: Running Area Events
-- ============================================================

CREATE TABLE IF NOT EXISTS running_area_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spot_id UUID REFERENCES running_spots(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  is_upcoming BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(spot_id, event_id)
);

-- ============================================================
-- Part 5: Running Area Gallery
-- ============================================================

CREATE TABLE IF NOT EXISTS running_area_gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spot_id UUID REFERENCES running_spots(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  photo_type TEXT CHECK (photo_type IN ('general', 'sunrise', 'group_run', 'marathon', 'track_condition', 'video')) DEFAULT 'general',
  width INTEGER,
  height INTEGER,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS running_area_gallery_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id UUID REFERENCES running_area_gallery(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(gallery_id, user_id)
);

-- ============================================================
-- Part 6: Enhanced Running Area Reviews
-- ============================================================

ALTER TABLE spot_reviews
  ADD COLUMN IF NOT EXISTS safety_rating INTEGER CHECK (safety_rating >= 1 AND safety_rating <= 5),
  ADD COLUMN IF NOT EXISTS cleanliness_rating INTEGER CHECK (cleanliness_rating >= 1 AND cleanliness_rating <= 5),
  ADD COLUMN IF NOT EXISTS lighting_rating INTEGER CHECK (lighting_rating >= 1 AND lighting_rating <= 5),
  ADD COLUMN IF NOT EXISTS crowd_rating INTEGER CHECK (crowd_rating >= 1 AND crowd_rating <= 5),
  ADD COLUMN IF NOT EXISTS scenery_rating INTEGER CHECK (scenery_rating >= 1 AND scenery_rating <= 5),
  ADD COLUMN IF NOT EXISTS surface_quality_rating INTEGER CHECK (surface_quality_rating >= 1 AND surface_quality_rating <= 5),
  ADD COLUMN IF NOT EXISTS facilities_rating INTEGER CHECK (facilities_rating >= 1 AND facilities_rating <= 5),
  ADD COLUMN IF NOT EXISTS videos TEXT[] DEFAULT '{}';

-- ============================================================
-- Part 7: Running Area Safety Information
-- ============================================================

CREATE TABLE IF NOT EXISTS running_area_safety (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spot_id UUID REFERENCES running_spots(id) ON DELETE CASCADE UNIQUE NOT NULL,
  emergency_contacts JSONB DEFAULT '[]'::jsonb,
  police_station_nearby BOOLEAN DEFAULT false,
  hospital_nearby BOOLEAN DEFAULT false,
  safe_running_hours TEXT,
  street_lighting_quality TEXT CHECK (street_lighting_quality IN ('poor', 'fair', 'good', 'excellent')),
  women_safety_tips TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Part 8: Running Area Weather Cache
-- ============================================================

CREATE TABLE IF NOT EXISTS running_area_weather (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spot_id UUID REFERENCES running_spots(id) ON DELETE CASCADE UNIQUE NOT NULL,
  temperature DOUBLE PRECISION,
  aqi INTEGER,
  humidity DOUBLE PRECISION,
  wind_speed DOUBLE PRECISION,
  rain_chance DOUBLE PRECISION,
  running_recommendation TEXT,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Part 9: Running Area Nearby Amenities
-- ============================================================

CREATE TABLE IF NOT EXISTS running_area_nearby (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spot_id UUID REFERENCES running_spots(id) ON DELETE CASCADE NOT NULL,
  amenity_type TEXT CHECK (amenity_type IN ('community', 'event', 'route', 'water_station', 'medical_facility', 'public_transport', 'parking', 'sports_shop')) NOT NULL,
  amenity_id UUID,
  name TEXT,
  distance_km DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Part 10: Running Area Bookmarks
-- ============================================================

CREATE TABLE IF NOT EXISTS running_area_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  spot_id UUID REFERENCES running_spots(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, spot_id)
);

-- ============================================================
-- Part 11: Indexes for Performance
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_running_spots_city ON running_spots(city);
CREATE INDEX IF NOT EXISTS idx_running_spots_spot_type ON running_spots(spot_type);
CREATE INDEX IF NOT EXISTS idx_running_spots_popularity ON running_spots(popularity_score DESC);
CREATE INDEX IF NOT EXISTS idx_running_spots_featured ON running_spots(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_running_spots_location ON running_spots(latitude, longitude);

CREATE INDEX IF NOT EXISTS idx_running_area_routes_spot ON running_area_routes(spot_id);
CREATE INDEX IF NOT EXISTS idx_running_area_routes_route ON running_area_routes(route_id);

CREATE INDEX IF NOT EXISTS idx_running_area_communities_spot ON running_area_communities(spot_id);
CREATE INDEX IF NOT EXISTS idx_running_area_communities_club ON running_area_communities(club_id);

CREATE INDEX IF NOT EXISTS idx_running_area_events_spot ON running_area_events(spot_id);
CREATE INDEX IF NOT EXISTS idx_running_area_events_upcoming ON running_area_events(is_upcoming) WHERE is_upcoming = true;

CREATE INDEX IF NOT EXISTS idx_running_area_gallery_spot ON running_area_gallery(spot_id);
CREATE INDEX IF NOT EXISTS idx_running_area_gallery_user ON running_area_gallery(user_id);
CREATE INDEX IF NOT EXISTS idx_running_area_gallery_type ON running_area_gallery(photo_type);

CREATE INDEX IF NOT EXISTS idx_running_area_nearby_spot ON running_area_nearby(spot_id);
CREATE INDEX IF NOT EXISTS idx_running_area_nearby_type ON running_area_nearby(amenity_type);

CREATE INDEX IF NOT EXISTS idx_running_area_bookmarks_user ON running_area_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_running_area_bookmarks_spot ON running_area_bookmarks(spot_id);

-- ============================================================
-- Part 12: Row Level Security Policies
-- ============================================================

-- Enable RLS on new tables
ALTER TABLE running_area_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE running_area_communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE running_area_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE running_area_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE running_area_gallery_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE running_area_safety ENABLE ROW LEVEL SECURITY;
ALTER TABLE running_area_weather ENABLE ROW LEVEL SECURITY;
ALTER TABLE running_area_nearby ENABLE ROW LEVEL SECURITY;
ALTER TABLE running_area_bookmarks ENABLE ROW LEVEL SECURITY;

-- Policies for running_spots (read for all, write for admins)
CREATE POLICY "running_spots_select_all" ON running_spots FOR SELECT USING (true);
CREATE POLICY "running_spots_insert_admin" ON running_spots FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "running_spots_update_admin" ON running_spots FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Policies for running_area_routes
CREATE POLICY "running_area_routes_select_all" ON running_area_routes FOR SELECT USING (true);
CREATE POLICY "running_area_routes_insert_admin" ON running_area_routes FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Policies for running_area_communities
CREATE POLICY "running_area_communities_select_all" ON running_area_communities FOR SELECT USING (true);
CREATE POLICY "running_area_communities_insert_admin" ON running_area_communities FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Policies for running_area_events
CREATE POLICY "running_area_events_select_all" ON running_area_events FOR SELECT USING (true);
CREATE POLICY "running_area_events_insert_admin" ON running_area_events FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Policies for running_area_gallery
CREATE POLICY "running_area_gallery_select_all" ON running_area_gallery FOR SELECT USING (true);
CREATE POLICY "running_area_gallery_insert_authenticated" ON running_area_gallery FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "running_area_gallery_update_owner" ON running_area_gallery FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "running_area_gallery_delete_owner" ON running_area_gallery FOR DELETE USING (user_id = auth.uid());

-- Policies for running_area_gallery_likes
CREATE POLICY "running_area_gallery_likes_select_all" ON running_area_gallery_likes FOR SELECT USING (true);
CREATE POLICY "running_area_gallery_likes_insert_authenticated" ON running_area_gallery_likes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "running_area_gallery_likes_delete_owner" ON running_area_gallery_likes FOR DELETE USING (user_id = auth.uid());

-- Policies for running_area_safety
CREATE POLICY "running_area_safety_select_all" ON running_area_safety FOR SELECT USING (true);
CREATE POLICY "running_area_safety_insert_admin" ON running_area_safety FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Policies for running_area_weather
CREATE POLICY "running_area_weather_select_all" ON running_area_weather FOR SELECT USING (true);

-- Policies for running_area_nearby
CREATE POLICY "running_area_nearby_select_all" ON running_area_nearby FOR SELECT USING (true);
CREATE POLICY "running_area_nearby_insert_admin" ON running_area_nearby FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Policies for running_area_bookmarks
CREATE POLICY "running_area_bookmarks_select_own" ON running_area_bookmarks FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "running_area_bookmarks_insert_authenticated" ON running_area_bookmarks FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "running_area_bookmarks_delete_own" ON running_area_bookmarks FOR DELETE USING (user_id = auth.uid());

-- ============================================================
-- Part 13: Triggers for Updated At
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_running_spots_updated_at BEFORE UPDATE ON running_spots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_running_area_safety_updated_at BEFORE UPDATE ON running_area_safety
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
