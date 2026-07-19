-- ============================================================
-- ZERO6 Maps & Community Layer — Schema Extension
-- Part 1: Routes
-- Part 2: Photos & Media
-- Part 3: Running Spots & Places
-- Part 4: Heatmap
-- Part 5: Collections & Bookmarks
-- Part 6: Live Runs
-- Part 7: Safety & Intelligence
-- Part 8: Community Galleries
-- Part 9: Route Reviews & Statistics
-- Part 10: Indexes & Extensions
-- ============================================================

-- ============================================================
-- Part 0: Enable PostGIS if available (for spatial queries)
-- ============================================================
-- CREATE EXTENSION IF NOT EXISTS postgis SCHEMA extensions;
-- CREATE EXTENSION IF NOT EXISTS postgis_topology SCHEMA extensions;

-- ============================================================
-- Part 1: Routes
-- ============================================================

-- Core routes table (community routes + user-created routes)
CREATE TABLE IF NOT EXISTS routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  distance DOUBLE PRECISION DEFAULT 0, -- meters
  duration_estimate INTEGER DEFAULT 0, -- seconds
  elevation_gain DOUBLE PRECISION DEFAULT 0,
  elevation_loss DOUBLE PRECISION DEFAULT 0,
  pace_estimate DOUBLE PRECISION DEFAULT 0, -- seconds per km
  calories_estimate INTEGER DEFAULT 0,
  difficulty TEXT CHECK (difficulty IN ('easy', 'moderate', 'hard', 'extreme')) DEFAULT 'moderate',
  surface_type TEXT CHECK (surface_type IN ('road', 'trail', 'track', 'park', 'mixed', 'treadmill')) DEFAULT 'road',
  route_type TEXT CHECK (route_type IN ('loop', 'out-and-back', 'point-to-point')) DEFAULT 'loop',
  geometry JSONB NOT NULL DEFAULT '[]'::jsonb, -- array of {lat, lng, elevation?}
  distance_waypoints JSONB DEFAULT '[]'::jsonb, -- cumulative distances per waypoint
  elevation_waypoints JSONB DEFAULT '[]'::jsonb, -- elevation at each waypoint
  start_location JSONB, -- {lat, lng, address?}
  end_location JSONB,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'India',
  tags TEXT[] DEFAULT '{}',
  is_public BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  status TEXT CHECK (status IN ('draft', 'published', 'archived')) DEFAULT 'published',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Route photos
CREATE TABLE IF NOT EXISTS route_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID REFERENCES routes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  location_name TEXT,
  city TEXT,
  is_cover BOOLEAN DEFAULT false,
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Route reviews & ratings
CREATE TABLE IF NOT EXISTS route_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID REFERENCES routes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  difficulty_rating INTEGER CHECK (difficulty_rating >= 1 AND difficulty_rating <= 5),
  safety_rating INTEGER CHECK (safety_rating >= 1 AND safety_rating <= 5),
  cleanliness_rating INTEGER CHECK (cleanliness_rating >= 1 AND cleanliness_rating <= 5),
  crowd_rating INTEGER CHECK (crowd_rating >= 1 AND crowd_rating <= 5),
  lighting_rating INTEGER CHECK (lighting_rating >= 1 AND lighting_rating <= 5),
  water_availability INTEGER CHECK (water_availability >= 1 AND water_availability <= 5),
  comment TEXT,
  photos TEXT[] DEFAULT '{}',
  videos TEXT[] DEFAULT '{}',
  would_recommend BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(route_id, user_id)
);

-- Route bookmarks
CREATE TABLE IF NOT EXISTS route_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  route_id UUID REFERENCES routes(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, route_id)
);

-- Route likes
CREATE TABLE IF NOT EXISTS route_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  route_id UUID REFERENCES routes(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, route_id)
);

-- Route collections (user-curated groups)
CREATE TABLE IF NOT EXISTS route_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  cover_photo_url TEXT,
  is_public BOOLEAN DEFAULT true,
  type TEXT CHECK (type IN ('favorites', 'weekend', 'training', 'hill', 'distance', 'time_of_day', 'custom')) DEFAULT 'custom',
  distance_category TEXT CHECK (distance_category IN ('5k', '10k', 'half_marathon', 'marathon', 'ultra', 'any')) DEFAULT 'any',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Collection items (routes in a collection)
CREATE TABLE IF NOT EXISTS route_collection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID REFERENCES route_collections(id) ON DELETE CASCADE NOT NULL,
  route_id UUID REFERENCES routes(id) ON DELETE CASCADE NOT NULL,
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(collection_id, route_id)
);

-- Route statistics (aggregated, updated by triggers)
CREATE TABLE IF NOT EXISTS route_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID REFERENCES routes(id) ON DELETE CASCADE UNIQUE NOT NULL,
  total_runs INTEGER DEFAULT 0,
  unique_runners INTEGER DEFAULT 0,
  average_pace DOUBLE PRECISION DEFAULT 0,
  fastest_time INTEGER DEFAULT 0,
  longest_distance DOUBLE PRECISION DEFAULT 0,
  average_rating DOUBLE PRECISION DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  community_score DOUBLE PRECISION DEFAULT 0,
  photo_count INTEGER DEFAULT 0,
  bookmark_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Part 2: Activity Photos (for community photos layer)
-- ============================================================

CREATE TABLE IF NOT EXISTS activity_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID REFERENCES activities(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  location_name TEXT,
  city TEXT,
  likes INTEGER DEFAULT 0,
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activity_photo_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id UUID REFERENCES activity_photos(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(photo_id, user_id)
);

-- ============================================================
-- Part 3: Running Spots & Community Places
-- ============================================================

CREATE TABLE IF NOT EXISTS running_spots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  cover_photo_url TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'India',
  spot_type TEXT CHECK (spot_type IN ('park', 'track', 'trail', 'waterfront', 'stadium', 'neighborhood', 'forest', 'beach', 'hill')) DEFAULT 'park',
  popularity_score DOUBLE PRECISION DEFAULT 0,
  average_rating DOUBLE PRECISION DEFAULT 0,
  total_runs INTEGER DEFAULT 0,
  total_photos INTEGER DEFAULT 0,
  total_runners INTEGER DEFAULT 0,
  best_time_to_run TEXT, -- e.g., "Early Morning (5-7 AM)"
  average_pace DOUBLE PRECISION DEFAULT 0,
  elevation_gain DOUBLE PRECISION DEFAULT 0,
  distance_range TEXT, -- e.g., "2-10 km"
  surface_type TEXT,
  safety_rating DOUBLE PRECISION DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Spot facilities
CREATE TABLE IF NOT EXISTS spot_facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spot_id UUID REFERENCES running_spots(id) ON DELETE CASCADE NOT NULL,
  facility_type TEXT CHECK (facility_type IN (
    'washroom', 'water_point', 'parking', 'lighting', 'changing_room',
    'shower', 'locker', 'drinking_fountain', 'first_aid', 'seating',
    'shade', 'bike_rack', 'dog_park', 'kids_play_area', 'track'
  )) NOT NULL,
  description TEXT,
  is_free BOOLEAN DEFAULT true,
  opening_hours TEXT,
  UNIQUE(spot_id, facility_type)
);

-- Spot reviews
CREATE TABLE IF NOT EXISTS spot_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spot_id UUID REFERENCES running_spots(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT,
  photos TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(spot_id, user_id)
);

-- Nearby POIs (cached from OSM / other sources)
CREATE TABLE IF NOT EXISTS nearby_pois (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT CHECK (category IN (
    'cafe', 'metro', 'hospital', 'pharmacy', 'running_store',
    'sports_shop', 'water_station', 'public_toilet', 'medical_facility',
    'meeting_point', 'police_station', 'embassy'
  )) NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  address TEXT,
  city TEXT,
  phone TEXT,
  website TEXT,
  opening_hours TEXT,
  rating DOUBLE PRECISION DEFAULT 0,
  source TEXT DEFAULT 'osm',
  external_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Part 4: Heatmap
-- ============================================================

-- Tile-based heatmap data (aggregated for performance)
CREATE TABLE IF NOT EXISTS heatmap_tiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zoom_level INTEGER NOT NULL,
  tile_x INTEGER NOT NULL,
  tile_y INTEGER NOT NULL,
  intensity DOUBLE PRECISION DEFAULT 0, -- normalized 0-1
  run_count INTEGER DEFAULT 0,
  runner_count INTEGER DEFAULT 0,
  total_distance DOUBLE PRECISION DEFAULT 0,
  period TEXT CHECK (period IN ('day', 'week', 'month', 'year', 'all')) DEFAULT 'all',
  time_of_day TEXT CHECK (time_of_day IN ('all', 'morning', 'afternoon', 'evening', 'night')) DEFAULT 'all',
  day_type TEXT CHECK (day_type IN ('all', 'weekday', 'weekend')) DEFAULT 'all',
  geometry JSONB, -- simplified geometry for the tile
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(zoom_level, tile_x, tile_y, period, time_of_day, day_type)
);

-- Raw heatmap waypoints (for personal heatmap)
CREATE TABLE IF NOT EXISTS heatmap_waypoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  activity_id UUID REFERENCES activities(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  altitude DOUBLE PRECISION,
  speed DOUBLE PRECISION,
  recorded_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Personal heatmap summary
CREATE TABLE IF NOT EXISTS personal_heatmap (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  grid_data JSONB DEFAULT '[]'::jsonb, -- array of {lat, lng, count, distance}
  total_unique_locations INTEGER DEFAULT 0,
  most_visited_location TEXT,
  longest_route_id UUID REFERENCES routes(id) ON DELETE SET NULL,
  favorite_route_id UUID REFERENCES routes(id) ON DELETE SET NULL,
  total_distance_covered DOUBLE PRECISION DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Part 5: Live Runs (opt-in)
-- ============================================================

CREATE TABLE IF NOT EXISTS live_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  session_id UUID, -- Will reference run_sessions when that table exists
  status TEXT CHECK (status IN ('active', 'paused', 'ended')) DEFAULT 'active',
  current_latitude DOUBLE PRECISION,
  current_longitude DOUBLE PRECISION,
  current_pace DOUBLE PRECISION DEFAULT 0,
  average_pace DOUBLE PRECISION DEFAULT 0,
  distance DOUBLE PRECISION DEFAULT 0,
  duration INTEGER DEFAULT 0,
  elevation_gain DOUBLE PRECISION DEFAULT 0,
  route JSONB DEFAULT '[]'::jsonb, -- live route so far
  estimated_finish_time TIMESTAMPTZ,
  visibility TEXT CHECK (visibility IN ('friends', 'followers', 'club')) DEFAULT 'friends',
  allow_join BOOLEAN DEFAULT false,
  allow_cheers BOOLEAN DEFAULT true,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Live run cheers/reactions
CREATE TABLE IF NOT EXISTS live_run_cheers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  live_run_id UUID REFERENCES live_runs(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reaction_type TEXT CHECK (reaction_type IN ('cheer', 'fire', 'clap', 'wave', 'good_job', 'keep_going')) DEFAULT 'cheer',
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(live_run_id, user_id)
);

-- Live run participants (if join enabled)
CREATE TABLE IF NOT EXISTS live_run_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  live_run_id UUID REFERENCES live_runs(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT CHECK (status IN ('joined', 'left')) DEFAULT 'joined',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(live_run_id, user_id)
);

-- ============================================================
-- Part 6: Safety & Intelligence
-- ============================================================

CREATE TABLE IF NOT EXISTS safety_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  aqi INTEGER DEFAULT 0, -- Air Quality Index
  uv_index DOUBLE PRECISION DEFAULT 0,
  humidity DOUBLE PRECISION DEFAULT 0,
  temperature DOUBLE PRECISION DEFAULT 0, -- Celsius
  rain_chance DOUBLE PRECISION DEFAULT 0,
  wind_speed DOUBLE PRECISION DEFAULT 0,
  weather_condition TEXT, -- clear, cloudy, rainy, etc.
  traffic_level TEXT CHECK (traffic_level IN ('low', 'moderate', 'high', 'very_high')),
  road_safety_rating INTEGER CHECK (road_safety_rating >= 1 AND road_safety_rating <= 5),
  street_lighting_rating INTEGER CHECK (street_lighting_rating >= 1 AND street_lighting_rating <= 5),
  crowd_density TEXT CHECK (crowd_density IN ('low', 'moderate', 'high')),
  emergency_contacts JSONB DEFAULT '[]'::jsonb,
  nearby_hospitals JSONB DEFAULT '[]'::jsonb,
  data_source TEXT DEFAULT 'openweather',
  city TEXT,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(latitude, longitude, recorded_at)
);

-- User privacy settings for map features
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS map_privacy JSONB DEFAULT jsonb_build_object(
  'hide_home', false,
  'hide_start_point', false,
  'hide_end_point', false,
  'hide_live_location', true,
  'blur_sensitive_areas', false,
  'map_visibility', 'friends',
  'show_on_heatmap', true,
  'show_on_nearby', false
);

-- ============================================================
-- Part 7: Community Galleries
-- ============================================================

CREATE TABLE IF NOT EXISTS city_galleries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city TEXT NOT NULL,
  state TEXT,
  cover_photo_url TEXT,
  trending_routes JSONB DEFAULT '[]'::jsonb,
  popular_parks JSONB DEFAULT '[]'::jsonb,
  active_clubs INTEGER DEFAULT 0,
  upcoming_events INTEGER DEFAULT 0,
  featured_runners JSONB DEFAULT '[]'::jsonb,
  total_routes INTEGER DEFAULT 0,
  total_photos INTEGER DEFAULT 0,
  total_runners INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(city)
);

-- Map layer preferences (per user)
CREATE TABLE IF NOT EXISTS user_map_layers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  layers JSONB DEFAULT jsonb_build_object(
    'heatmap', true,
    'community_photos', false,
    'routes', true,
    'events', true,
    'clubs', true,
    'challenges', false,
    'running_spots', true,
    'water_points', false,
    'medical', false,
    'weather', false,
    'aqi', false,
    'traffic', false
  ),
  map_style TEXT DEFAULT 'street',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Part 8: Indexes
-- ============================================================

-- Route indexes
CREATE INDEX IF NOT EXISTS idx_routes_city ON routes(city);
CREATE INDEX IF NOT EXISTS idx_routes_user_id ON routes(user_id);
CREATE INDEX IF NOT EXISTS idx_routes_is_public ON routes(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_routes_difficulty ON routes(difficulty);
CREATE INDEX IF NOT EXISTS idx_routes_route_type ON routes(route_type);
CREATE INDEX IF NOT EXISTS idx_routes_surface_type ON routes(surface_type);
CREATE INDEX IF NOT EXISTS idx_routes_tags ON routes USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_routes_created_at ON routes(created_at DESC);

-- Photo indexes
CREATE INDEX IF NOT EXISTS idx_route_photos_route_id ON route_photos(route_id);
CREATE INDEX IF NOT EXISTS idx_activity_photos_location ON activity_photos(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_activity_photos_city ON activity_photos(city);
CREATE INDEX IF NOT EXISTS idx_activity_photos_created_at ON activity_photos(created_at DESC);

-- Heatmap indexes
CREATE INDEX IF NOT EXISTS idx_heatmap_tiles_coords ON heatmap_tiles(zoom_level, tile_x, tile_y);
CREATE INDEX IF NOT EXISTS idx_heatmap_tiles_period ON heatmap_tiles(period);
CREATE INDEX IF NOT EXISTS idx_heatmap_waypoints_user ON heatmap_waypoints(user_id);
CREATE INDEX IF NOT EXISTS idx_heatmap_waypoints_coords ON heatmap_waypoints(user_id, latitude, longitude);

-- Spot indexes
CREATE INDEX IF NOT EXISTS idx_running_spots_location ON running_spots(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_running_spots_city ON running_spots(city);
CREATE INDEX IF NOT EXISTS idx_running_spots_popularity ON running_spots(popularity_score DESC);

-- POI indexes
CREATE INDEX IF NOT EXISTS idx_nearby_pois_location ON nearby_pois(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_nearby_pois_category ON nearby_pois(category);

-- Live run indexes
CREATE INDEX IF NOT EXISTS idx_live_runs_status ON live_runs(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_live_runs_location ON live_runs(current_latitude, current_longitude) WHERE status = 'active';

-- Review indexes
CREATE INDEX IF NOT EXISTS idx_route_reviews_route ON route_reviews(route_id);
CREATE INDEX IF NOT EXISTS idx_spot_reviews_spot ON spot_reviews(spot_id);

-- Safety indexes
CREATE INDEX IF NOT EXISTS idx_safety_data_location ON safety_data(latitude, longitude);

-- Collection indexes
CREATE INDEX IF NOT EXISTS idx_route_collections_user ON route_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_route_collection_items_collection ON route_collection_items(collection_id);

-- City galleries
CREATE INDEX IF NOT EXISTS idx_city_galleries_city ON city_galleries(city);

-- ============================================================
-- Part 9: RLS Policies
-- ============================================================

ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_photo_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE running_spots ENABLE ROW LEVEL SECURITY;
ALTER TABLE spot_facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE spot_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE nearby_pois ENABLE ROW LEVEL SECURITY;
ALTER TABLE heatmap_tiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE heatmap_waypoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_heatmap ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_run_cheers ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_run_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE city_galleries ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_map_layers ENABLE ROW LEVEL SECURITY;

-- Routes
DROP POLICY IF EXISTS "Routes are viewable by everyone" ON routes;
CREATE POLICY "Routes are viewable by everyone" ON routes FOR SELECT USING (is_public = true OR user_id = auth.uid());
DROP POLICY IF EXISTS "Users can insert own routes" ON routes;
CREATE POLICY "Users can insert own routes" ON routes FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can update own routes" ON routes;
CREATE POLICY "Users can update own routes" ON routes FOR UPDATE USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can delete own routes" ON routes;
CREATE POLICY "Users can delete own routes" ON routes FOR DELETE USING (user_id = auth.uid());

-- Route photos
DROP POLICY IF EXISTS "Route photos viewable by everyone" ON route_photos;
CREATE POLICY "Route photos viewable by everyone" ON route_photos FOR SELECT USING (EXISTS (SELECT 1 FROM routes WHERE routes.id = route_photos.route_id AND (routes.is_public OR routes.user_id = auth.uid())));
DROP POLICY IF EXISTS "Users can insert own route photos" ON route_photos;
CREATE POLICY "Users can insert own route photos" ON route_photos FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can delete own route photos" ON route_photos;
CREATE POLICY "Users can delete own route photos" ON route_photos FOR DELETE USING (user_id = auth.uid());

-- Route reviews
DROP POLICY IF EXISTS "Reviews viewable by everyone" ON route_reviews;
CREATE POLICY "Reviews viewable by everyone" ON route_reviews FOR SELECT USING (EXISTS (SELECT 1 FROM routes WHERE routes.id = route_reviews.route_id));
DROP POLICY IF EXISTS "Users can insert own reviews" ON route_reviews;
CREATE POLICY "Users can insert own reviews" ON route_reviews FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can update own reviews" ON route_reviews;
CREATE POLICY "Users can update own reviews" ON route_reviews FOR UPDATE USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can delete own reviews" ON route_reviews;
CREATE POLICY "Users can delete own reviews" ON route_reviews FOR DELETE USING (user_id = auth.uid());

-- Bookmarks
DROP POLICY IF EXISTS "Users can view own bookmarks" ON route_bookmarks;
CREATE POLICY "Users can view own bookmarks" ON route_bookmarks FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can insert own bookmarks" ON route_bookmarks;
CREATE POLICY "Users can insert own bookmarks" ON route_bookmarks FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can delete own bookmarks" ON route_bookmarks;
CREATE POLICY "Users can delete own bookmarks" ON route_bookmarks FOR DELETE USING (user_id = auth.uid());

-- Route likes
DROP POLICY IF EXISTS "Route likes viewable by everyone" ON route_likes;
CREATE POLICY "Route likes viewable by everyone" ON route_likes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert own likes" ON route_likes;
CREATE POLICY "Users can insert own likes" ON route_likes FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can delete own likes" ON route_likes;
CREATE POLICY "Users can delete own likes" ON route_likes FOR DELETE USING (user_id = auth.uid());

-- Collections
DROP POLICY IF EXISTS "Users can view own collections or public ones" ON route_collections;
CREATE POLICY "Users can view own collections or public ones" ON route_collections FOR SELECT USING (user_id = auth.uid() OR is_public);
DROP POLICY IF EXISTS "Users can insert own collections" ON route_collections;
CREATE POLICY "Users can insert own collections" ON route_collections FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can update own collections" ON route_collections;
CREATE POLICY "Users can update own collections" ON route_collections FOR UPDATE USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can delete own collections" ON route_collections;
CREATE POLICY "Users can delete own collections" ON route_collections FOR DELETE USING (user_id = auth.uid());

-- Collection items
DROP POLICY IF EXISTS "Collection items viewable with collection" ON route_collection_items;
CREATE POLICY "Collection items viewable with collection" ON route_collection_items FOR SELECT USING (EXISTS (SELECT 1 FROM route_collections WHERE route_collections.id = route_collection_items.collection_id AND (route_collections.user_id = auth.uid() OR route_collections.is_public)));
DROP POLICY IF EXISTS "Users can manage own collection items" ON route_collection_items;
CREATE POLICY "Users can manage own collection items" ON route_collection_items FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM route_collections WHERE route_collections.id = route_collection_items.collection_id AND route_collections.user_id = auth.uid()));
DROP POLICY IF EXISTS "Users can delete own collection items" ON route_collection_items;
CREATE POLICY "Users can delete own collection items" ON route_collection_items FOR DELETE USING (EXISTS (SELECT 1 FROM route_collections WHERE route_collections.id = route_collection_items.collection_id AND route_collections.user_id = auth.uid()));

-- Activity photos
DROP POLICY IF EXISTS "Activity photos viewable by everyone" ON activity_photos;
CREATE POLICY "Activity photos viewable by everyone" ON activity_photos FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert own activity photos" ON activity_photos;
CREATE POLICY "Users can insert own activity photos" ON activity_photos FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can delete own activity photos" ON activity_photos;
CREATE POLICY "Users can delete own activity photos" ON activity_photos FOR DELETE USING (user_id = auth.uid());

-- Activity photo likes
DROP POLICY IF EXISTS "Photo likes viewable by everyone" ON activity_photo_likes;
CREATE POLICY "Photo likes viewable by everyone" ON activity_photo_likes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can like photos" ON activity_photo_likes;
CREATE POLICY "Users can like photos" ON activity_photo_likes FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can unlike photos" ON activity_photo_likes;
CREATE POLICY "Users can unlike photos" ON activity_photo_likes FOR DELETE USING (user_id = auth.uid());

-- Running spots (read-only for regular users)
DROP POLICY IF EXISTS "Spots viewable by everyone" ON running_spots;
CREATE POLICY "Spots viewable by everyone" ON running_spots FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage spots" ON running_spots;
CREATE POLICY "Admins can manage spots" ON running_spots FOR ALL USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- Spot facilities
DROP POLICY IF EXISTS "Facilities viewable by everyone" ON spot_facilities;
CREATE POLICY "Facilities viewable by everyone" ON spot_facilities FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage facilities" ON spot_facilities;
CREATE POLICY "Admins can manage facilities" ON spot_facilities FOR ALL USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- Spot reviews
DROP POLICY IF EXISTS "Spot reviews viewable by everyone" ON spot_reviews;
CREATE POLICY "Spot reviews viewable by everyone" ON spot_reviews FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert own spot reviews" ON spot_reviews;
CREATE POLICY "Users can insert own spot reviews" ON spot_reviews FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can update own spot reviews" ON spot_reviews;
CREATE POLICY "Users can update own spot reviews" ON spot_reviews FOR UPDATE USING (user_id = auth.uid());

-- POIs
DROP POLICY IF EXISTS "POIs viewable by everyone" ON nearby_pois;
CREATE POLICY "POIs viewable by everyone" ON nearby_pois FOR SELECT USING (true);

-- Heatmap tiles (public)
DROP POLICY IF EXISTS "Heatmap tiles viewable by everyone" ON heatmap_tiles;
CREATE POLICY "Heatmap tiles viewable by everyone" ON heatmap_tiles FOR SELECT USING (true);

-- Heatmap waypoints (user only)
DROP POLICY IF EXISTS "Users can view own heatmap waypoints" ON heatmap_waypoints;
CREATE POLICY "Users can view own heatmap waypoints" ON heatmap_waypoints FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can insert own heatmap waypoints" ON heatmap_waypoints;
CREATE POLICY "Users can insert own heatmap waypoints" ON heatmap_waypoints FOR INSERT WITH CHECK (user_id = auth.uid());

-- Personal heatmap (user only)
DROP POLICY IF EXISTS "Users can view own personal heatmap" ON personal_heatmap;
CREATE POLICY "Users can view own personal heatmap" ON personal_heatmap FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can update own personal heatmap" ON personal_heatmap;
CREATE POLICY "Users can update own personal heatmap" ON personal_heatmap FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can manage own personal heatmap" ON personal_heatmap;
CREATE POLICY "Users can manage own personal heatmap" ON personal_heatmap FOR UPDATE USING (user_id = auth.uid());

-- Live runs
DROP POLICY IF EXISTS "Users can view friends live runs" ON live_runs;
CREATE POLICY "Users can view friends live runs" ON live_runs FOR SELECT USING (
  status = 'active' AND user_id = auth.uid()
);
DROP POLICY IF EXISTS "Users can insert own live run" ON live_runs;
CREATE POLICY "Users can insert own live run" ON live_runs FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can update own live run" ON live_runs;
CREATE POLICY "Users can update own live run" ON live_runs FOR UPDATE USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can delete own live run" ON live_runs;
CREATE POLICY "Users can delete own live run" ON live_runs FOR DELETE USING (user_id = auth.uid());

-- Live run cheers
DROP POLICY IF EXISTS "Cheers viewable by participants" ON live_run_cheers;
CREATE POLICY "Cheers viewable by participants" ON live_run_cheers FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can cheer" ON live_run_cheers;
CREATE POLICY "Users can cheer" ON live_run_cheers FOR INSERT WITH CHECK (user_id = auth.uid());

-- Live run participants
DROP POLICY IF EXISTS "Participants viewable by run owner" ON live_run_participants;
CREATE POLICY "Participants viewable by run owner" ON live_run_participants FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can join" ON live_run_participants;
CREATE POLICY "Users can join" ON live_run_participants FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can leave" ON live_run_participants;
CREATE POLICY "Users can leave" ON live_run_participants FOR DELETE USING (user_id = auth.uid());

-- Safety data (public)
DROP POLICY IF EXISTS "Safety data viewable by everyone" ON safety_data;
CREATE POLICY "Safety data viewable by everyone" ON safety_data FOR SELECT USING (true);

-- City galleries (public)
DROP POLICY IF EXISTS "Galleries viewable by everyone" ON city_galleries;
CREATE POLICY "Galleries viewable by everyone" ON city_galleries FOR SELECT USING (true);

-- Map layers (user only)
DROP POLICY IF EXISTS "Users can view own map layers" ON user_map_layers;
CREATE POLICY "Users can view own map layers" ON user_map_layers FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can manage own map layers" ON user_map_layers;
CREATE POLICY "Users can manage own map layers" ON user_map_layers FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can manage own map layers update" ON user_map_layers;
CREATE POLICY "Users can manage own map layers update" ON user_map_layers FOR UPDATE USING (user_id = auth.uid());

-- Route statistics (public read)
DROP POLICY IF EXISTS "Statistics viewable by everyone" ON route_statistics;
CREATE POLICY "Statistics viewable by everyone" ON route_statistics FOR SELECT USING (true);

-- ============================================================
-- Part 10: Functions & Triggers
-- ============================================================

-- Update route statistics on review/bookmark/like changes
CREATE OR REPLACE FUNCTION update_route_statistics(p_route_id UUID) RETURNS VOID AS $$
BEGIN
  INSERT INTO route_statistics (route_id, average_rating, review_count, bookmark_count, like_count, photo_count)
  SELECT
    p_route_id,
    COALESCE((SELECT AVG(rating)::DOUBLE PRECISION FROM route_reviews WHERE route_id = p_route_id), 0),
    (SELECT COUNT(*) FROM route_reviews WHERE route_id = p_route_id),
    (SELECT COUNT(*) FROM route_bookmarks WHERE route_id = p_route_id),
    (SELECT COUNT(*) FROM route_likes WHERE route_id = p_route_id),
    (SELECT COUNT(*) FROM route_photos WHERE route_id = p_route_id)
  ON CONFLICT (route_id) DO UPDATE SET
    average_rating = EXCLUDED.average_rating,
    review_count = EXCLUDED.review_count,
    bookmark_count = EXCLUDED.bookmark_count,
    like_count = EXCLUDED.like_count,
    photo_count = EXCLUDED.photo_count,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Trigger: update stats on review insert
CREATE OR REPLACE FUNCTION trigger_update_route_stats_review() RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_route_statistics(NEW.route_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_route_review_stats ON route_reviews;
CREATE TRIGGER trg_route_review_stats
  AFTER INSERT OR UPDATE OR DELETE ON route_reviews
  FOR EACH ROW EXECUTE FUNCTION trigger_update_route_stats_review();

-- Trigger: update stats on bookmark
CREATE OR REPLACE FUNCTION trigger_update_route_stats_bookmark() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM update_route_statistics(NEW.route_id);
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM update_route_statistics(OLD.route_id);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_route_bookmark_stats ON route_bookmarks;
CREATE TRIGGER trg_route_bookmark_stats
  AFTER INSERT OR DELETE ON route_bookmarks
  FOR EACH ROW EXECUTE FUNCTION trigger_update_route_stats_bookmark();

-- Trigger: update stats on like
CREATE OR REPLACE FUNCTION trigger_update_route_stats_like() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM update_route_statistics(NEW.route_id);
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM update_route_statistics(OLD.route_id);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_route_like_stats ON route_likes;
CREATE TRIGGER trg_route_like_stats
  AFTER INSERT OR DELETE ON route_likes
  FOR EACH ROW EXECUTE FUNCTION trigger_update_route_stats_like();

-- Trigger: update route updated_at
CREATE OR REPLACE FUNCTION trigger_set_route_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_route_updated_at ON routes;
CREATE TRIGGER trg_route_updated_at
  BEFORE UPDATE ON routes
  FOR EACH ROW EXECUTE FUNCTION trigger_set_route_updated_at();

-- Seed India running spots
INSERT INTO running_spots (name, description, city, state, latitude, longitude, spot_type, is_verified, tags) VALUES
  ('India Gate', 'Iconic war memorial surrounded by lush lawns. Popular for morning runs and group training.', 'New Delhi', 'Delhi', 28.6129, 77.2295, 'park', true, ARRAY['landmark', 'morning', 'group_run']),
  ('Marine Drive', 'Scenic coastal road along the Arabian Sea. Flat, well-lit, and perfect for evening runs.', 'Mumbai', 'Maharashtra', 18.9440, 72.8226, 'waterfront', true, ARRAY['scenic', 'evening', 'flat']),
  ('Cubbon Park', 'Expansive green lung in the heart of Bangalore. Shaded loop trails with varying distances.', 'Bengaluru', 'Karnataka', 12.9763, 77.5929, 'park', true, ARRAY['shaded', 'trail', 'group_run']),
  ('Lodhi Garden', 'Historic garden with tombs and tree-lined paths. Peaceful morning running spot.', 'New Delhi', 'Delhi', 28.5931, 77.2205, 'park', true, ARRAY['historic', 'peaceful', 'morning']),
  ('Nehru Park', 'Sprawling park with dedicated walking and jogging tracks.', 'New Delhi', 'Delhi', 28.5969, 77.2409, 'park', true, ARRAY['track', 'morning']),
  ('KBR Park', 'Kasu Brahmananda Reddy National Park. Forested trails with wildlife spotting.', 'Hyderabad', 'Telangana', 17.4213, 78.4394, 'forest', true, ARRAY['trail', 'nature', 'forest']),
  ('MG Road Track', 'Popular morning track along MG Road. Flat and fast for speed work.', 'Bengaluru', 'Karnataka', 12.9756, 77.6068, 'track', true, ARRAY['track', 'speed', 'morning']),
  ('Bandra Seafront', 'Promenade along Bandra coast. Bustling with runners and walkers every morning.', 'Mumbai', 'Maharashtra', 19.0549, 72.8277, 'waterfront', true, ARRAY['scenic', 'social', 'morning']),
  ('Tantri Park', 'Scenic trail loop with lake views and bird watching.', 'Mysuru', 'Karnataka', 12.3083, 76.6414, 'park', true, ARRAY['lake', 'scenic', 'trail']),
  ('Assi Ghat Running Track', 'Riverside promenade along the Ganges. Spiritual morning runs with temple views.', 'Varanasi', 'Uttar Pradesh', 25.2877, 82.9961, 'waterfront', true, ARRAY['riverside', 'spiritual', 'morning'])
ON CONFLICT DO NOTHING;

-- Facilities for seeded spots
INSERT INTO spot_facilities (spot_id, facility_type, description, is_free)
SELECT id, 'washroom', 'Public washrooms available', true FROM running_spots WHERE name = 'India Gate'
UNION ALL SELECT id, 'parking', 'Paid parking available', false FROM running_spots WHERE name = 'India Gate'
UNION ALL SELECT id, 'water_point', 'Water fountains along the path', true FROM running_spots WHERE name = 'India Gate'
UNION ALL SELECT id, 'washroom', 'Public washrooms at regular intervals', true FROM running_spots WHERE name = 'Marine Drive'
UNION ALL SELECT id, 'water_point', 'Drinking water available at multiple points', true FROM running_spots WHERE name = 'Cubbon Park'
UNION ALL SELECT id, 'parking', 'Parking available at main gates', false FROM running_spots WHERE name = 'Cubbon Park'
UNION ALL SELECT id, 'lighting', 'Well-lit throughout', true FROM running_spots WHERE name = 'Cubbon Park'
UNION ALL SELECT id, 'washroom', 'Washrooms at both ends of the park', true FROM running_spots WHERE name = 'Lodhi Garden'
UNION ALL SELECT id, 'water_point', 'Water taps available', true FROM running_spots WHERE name = 'Lodhi Garden'
ON CONFLICT DO NOTHING;
