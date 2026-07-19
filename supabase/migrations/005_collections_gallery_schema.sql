-- ===========================================
-- ZERO6 — Collections & Gallery Schema
-- Run this in Supabase SQL Editor
-- ===========================================

-- ----------------------------------------------------------------
-- ROUTE COLLECTIONS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS route_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  cover_photo_url TEXT DEFAULT '',
  type TEXT NOT NULL DEFAULT 'custom' CHECK (type IN ('favorites', 'weekend', 'training', 'hill', 'distance', 'time_of_day', 'custom')),
  distance_category TEXT NOT NULL DEFAULT 'any' CHECK (distance_category IN ('5k', '10k', 'half_marathon', 'marathon', 'ultra', 'any')),
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_route_collections_user_id ON route_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_route_collections_type ON route_collections(type);

-- ----------------------------------------------------------------
-- ROUTE COLLECTION ITEMS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS route_collection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES route_collections(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(collection_id, activity_id)
);

CREATE INDEX IF NOT EXISTS idx_route_collection_items_collection_id ON route_collection_items(collection_id);
CREATE INDEX IF NOT EXISTS idx_route_collection_items_activity_id ON route_collection_items(activity_id);

-- ----------------------------------------------------------------
-- CITY GALLERIES
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS city_galleries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city TEXT NOT NULL,
  state TEXT DEFAULT '',
  cover_photo_url TEXT DEFAULT '',
  total_routes INTEGER NOT NULL DEFAULT 0,
  total_photos INTEGER NOT NULL DEFAULT 0,
  total_runners INTEGER NOT NULL DEFAULT 0,
  active_clubs INTEGER NOT NULL DEFAULT 0,
  upcoming_events INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(city, state)
);

CREATE INDEX IF NOT EXISTS idx_city_galleries_city ON city_galleries(city);

-- ----------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ----------------------------------------------------------------
ALTER TABLE route_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE city_galleries ENABLE ROW LEVEL SECURITY;

-- ROUTE COLLECTIONS
DROP POLICY IF EXISTS "Route collections are viewable by everyone" ON route_collections;
DROP POLICY IF EXISTS "Users can create own collections" ON route_collections;
DROP POLICY IF EXISTS "Users can update own collections" ON route_collections;
DROP POLICY IF EXISTS "Users can delete own collections" ON route_collections;

CREATE POLICY "Route collections are viewable by everyone" ON route_collections FOR SELECT USING (true);
CREATE POLICY "Users can create own collections" ON route_collections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own collections" ON route_collections FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own collections" ON route_collections FOR DELETE USING (auth.uid() = user_id);

-- ROUTE COLLECTION ITEMS
DROP POLICY IF EXISTS "Collection items are viewable by everyone" ON route_collection_items;
DROP POLICY IF EXISTS "Users can add to own collections" ON route_collection_items;
DROP POLICY IF EXISTS "Users can remove from own collections" ON route_collection_items;

CREATE POLICY "Collection items are viewable by everyone" ON route_collection_items FOR SELECT USING (true);
CREATE POLICY "Users can add to own collections" ON route_collection_items FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT user_id FROM route_collections WHERE id = collection_id)
);
CREATE POLICY "Users can remove from own collections" ON route_collection_items FOR DELETE USING (
  auth.uid() IN (SELECT user_id FROM route_collections WHERE id = collection_id)
);

-- CITY GALLERIES
DROP POLICY IF EXISTS "City galleries are viewable by everyone" ON city_galleries;
DROP POLICY IF EXISTS "Admins can manage city galleries" ON city_galleries;

CREATE POLICY "City galleries are viewable by everyone" ON city_galleries FOR SELECT USING (true);
CREATE POLICY "Admins can manage city galleries" ON city_galleries FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ----------------------------------------------------------------
-- TRIGGERS
-- ----------------------------------------------------------------
-- Note: update_updated_at function should already exist from migration 001
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_route_collections_updated_at'
  ) THEN
    CREATE TRIGGER update_route_collections_updated_at 
      BEFORE UPDATE ON route_collections
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_city_galleries_updated_at'
  ) THEN
    CREATE TRIGGER update_city_galleries_updated_at 
      BEFORE UPDATE ON city_galleries
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

-- ----------------------------------------------------------------
-- SAMPLE DATA (for testing)
-- ----------------------------------------------------------------
INSERT INTO city_galleries (city, state, total_routes, total_photos, total_runners, active_clubs, upcoming_events)
VALUES 
  ('Mumbai', 'Maharashtra', 150, 320, 450, 12, 5),
  ('Delhi', 'Delhi', 120, 280, 380, 10, 4),
  ('Bangalore', 'Karnataka', 180, 450, 520, 15, 6),
  ('Chennai', 'Tamil Nadu', 95, 210, 290, 8, 3),
  ('Kolkata', 'West Bengal', 85, 190, 260, 7, 3),
  ('Hyderabad', 'Telangana', 110, 250, 340, 9, 4)
ON CONFLICT (city, state) DO NOTHING;
