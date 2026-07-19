-- ================================================================
-- ZERO6 — Community System Rebuild
-- Adds: chat channels, albums, community routes/runs, member stats,
--        settings, and missing columns on existing tables.
-- ================================================================

-- ================================================================
-- PART 1: ADD MISSING COLUMNS TO EXISTING TABLES
-- ================================================================

-- clubs: feature toggles & welcome message
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS welcome_message TEXT DEFAULT '';
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS chat_enabled BOOLEAN DEFAULT true;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS gallery_enabled BOOLEAN DEFAULT true;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS events_enabled BOOLEAN DEFAULT true;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS runs_enabled BOOLEAN DEFAULT true;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS routes_enabled BOOLEAN DEFAULT true;

-- club_members: per-community metadata
ALTER TABLE club_members ADD COLUMN IF NOT EXISTS nickname TEXT DEFAULT '';
ALTER TABLE club_members ADD COLUMN IF NOT EXISTS xp_in_community INTEGER DEFAULT 0;
ALTER TABLE club_members ADD COLUMN IF NOT EXISTS joined_via TEXT DEFAULT 'direct';

-- community_feed: richer post types
ALTER TABLE community_feed ADD COLUMN IF NOT EXISTS route_id UUID;
ALTER TABLE community_feed ADD COLUMN IF NOT EXISTS achievement_id UUID;

-- community_chat_messages: channel support & reactions
ALTER TABLE community_chat_messages ADD COLUMN IF NOT EXISTS channel_id UUID;
ALTER TABLE community_chat_messages ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '{}';

-- ================================================================
-- PART 2: NEW TABLES
-- ================================================================

-- ----------------------------------------------------------------
-- 1. Community Chat Channels (Discord-style)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS community_chat_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  icon TEXT DEFAULT '💬',
  is_default BOOLEAN DEFAULT false,
  is_announcement_only BOOLEAN DEFAULT false,
  position INTEGER DEFAULT 0,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_channels_club ON community_chat_channels(club_id, position);

ALTER TABLE community_chat_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Chat channels visible to members" ON community_chat_channels
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM club_members
      WHERE club_id = community_chat_channels.club_id
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "Chat channels insert admins" ON community_chat_channels
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM club_members
      WHERE club_id = community_chat_channels.club_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'moderator')
    )
  );

CREATE POLICY "Chat channels update admins" ON community_chat_channels
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM club_members
      WHERE club_id = community_chat_channels.club_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'moderator')
    )
  );

CREATE POLICY "Chat channels delete admins" ON community_chat_channels
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM club_members
      WHERE club_id = community_chat_channels.club_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'moderator')
    )
  );

-- ----------------------------------------------------------------
-- 2. Community Albums (grouped gallery)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS community_albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  cover_url TEXT,
  photo_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_albums_club ON community_albums(club_id, created_at DESC);

ALTER TABLE community_albums ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Albums visible to members" ON community_albums
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM club_members
      WHERE club_id = community_albums.club_id
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "Albums insert members" ON community_albums
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM club_members
      WHERE club_id = community_albums.club_id
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "Albums update owner" ON community_albums
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Albums delete owner or admin" ON community_albums
  FOR DELETE USING (
    auth.uid() = created_by
    OR EXISTS (
      SELECT 1 FROM club_members
      WHERE club_id = community_albums.club_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'moderator')
    )
  );

-- ----------------------------------------------------------------
-- 3. Community Album Photos
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS community_album_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id UUID NOT NULL REFERENCES community_albums(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_album_photos_album ON community_album_photos(album_id, position);

ALTER TABLE community_album_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Album photos visible to members" ON community_album_photos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM community_albums a
      JOIN club_members cm ON cm.club_id = a.club_id
      WHERE a.id = community_album_photos.album_id
        AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Album photos insert members" ON community_album_photos
  FOR INSERT WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Album photos delete uploader or admin" ON community_album_photos
  FOR DELETE USING (
    auth.uid() = uploaded_by
    OR EXISTS (
      SELECT 1 FROM community_albums a
      JOIN club_members cm ON cm.club_id = a.club_id
      WHERE a.id = community_album_photos.album_id
        AND cm.user_id = auth.uid()
        AND cm.role IN ('owner', 'moderator')
    )
  );

-- ----------------------------------------------------------------
-- 4. Community Routes (routes linked to clubs)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS community_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  distance DOUBLE PRECISION NOT NULL DEFAULT 0,
  elevation_gain DOUBLE PRECISION DEFAULT 0,
  difficulty TEXT DEFAULT 'easy' CHECK (difficulty IN ('easy', 'moderate', 'hard', 'extreme')),
  location TEXT DEFAULT '',
  city TEXT DEFAULT '',
  coordinates JSONB DEFAULT '[]',
  image_url TEXT DEFAULT '',
  strava_segment_id TEXT,
  times_completed INTEGER DEFAULT 0,
  best_time INTEGER,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_community_routes_club ON community_routes(club_id, created_at DESC);

ALTER TABLE community_routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Community routes visible to members" ON community_routes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM club_members
      WHERE club_id = community_routes.club_id
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "Community routes insert members" ON community_routes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM club_members
      WHERE club_id = community_routes.club_id
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "Community routes update creator or admin" ON community_routes
  FOR UPDATE USING (
    auth.uid() = created_by
    OR EXISTS (
      SELECT 1 FROM club_members
      WHERE club_id = community_routes.club_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'moderator')
    )
  );

CREATE POLICY "Community routes delete creator or admin" ON community_routes
  FOR DELETE USING (
    auth.uid() = created_by
    OR EXISTS (
      SELECT 1 FROM club_members
      WHERE club_id = community_routes.club_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'moderator')
    )
  );

-- ----------------------------------------------------------------
-- 5. Community Runs (group run events)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS community_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  route_id UUID REFERENCES community_routes(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  scheduled_at TIMESTAMPTZ NOT NULL,
  meeting_point TEXT,
  distance DOUBLE PRECISION,
  pace_group TEXT,
  max_participants INTEGER DEFAULT 50,
  registered_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed', 'cancelled')),
  weather_notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_community_runs_club ON community_runs(club_id, scheduled_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_runs_status ON community_runs(status, scheduled_at);

ALTER TABLE community_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Community runs visible to members" ON community_runs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM club_members
      WHERE club_id = community_runs.club_id
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "Community runs insert members" ON community_runs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM club_members
      WHERE club_id = community_runs.club_id
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "Community runs update creator or admin" ON community_runs
  FOR UPDATE USING (
    auth.uid() = created_by
    OR EXISTS (
      SELECT 1 FROM club_members
      WHERE club_id = community_runs.club_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'moderator')
    )
  );

-- ----------------------------------------------------------------
-- 6. Community Run Registrations
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS community_run_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES community_runs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  registered_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(run_id, user_id)
);

ALTER TABLE community_run_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Run registrations visible to members" ON community_run_registrations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM community_runs r
      JOIN club_members cm ON cm.club_id = r.club_id
      WHERE r.id = community_run_registrations.run_id
        AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Run registrations insert own" ON community_run_registrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Run registrations delete own" ON community_run_registrations
  FOR DELETE USING (auth.uid() = user_id);

-- ----------------------------------------------------------------
-- 7. Community Member Stats (XP per community)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS community_member_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  total_distance DOUBLE PRECISION DEFAULT 0,
  total_runs INTEGER DEFAULT 0,
  total_duration INTEGER DEFAULT 0,
  total_elevation DOUBLE PRECISION DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  xp INTEGER DEFAULT 0,
  last_run_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(club_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_member_stats_club ON community_member_stats(club_id, xp DESC);
CREATE INDEX IF NOT EXISTS idx_member_stats_user ON community_member_stats(user_id);

ALTER TABLE community_member_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Member stats visible to members" ON community_member_stats
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM club_members
      WHERE club_id = community_member_stats.club_id
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "Member stats upsert system" ON community_member_stats
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Member stats update system" ON community_member_stats
  FOR UPDATE USING (true);

-- ----------------------------------------------------------------
-- 8. Community Settings (per-club config)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS community_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL UNIQUE REFERENCES clubs(id) ON DELETE CASCADE,
  default_channel_id UUID REFERENCES community_chat_channels(id) ON DELETE SET NULL,
  welcome_message TEXT DEFAULT '',
  auto_approve_members BOOLEAN DEFAULT true,
  allow_member_posts BOOLEAN DEFAULT true,
  allow_member_events BOOLEAN DEFAULT false,
  allow_member_challenges BOOLEAN DEFAULT false,
  require_post_approval BOOLEAN DEFAULT false,
  muted_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE community_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Community settings visible to members" ON community_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM club_members
      WHERE club_id = community_settings.club_id
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "Community settings update owner" ON community_settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM club_members
      WHERE club_id = community_settings.club_id
        AND user_id = auth.uid()
        AND role = 'owner'
    )
  );

-- ----------------------------------------------------------------
-- 9. Community Member Badges
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS community_member_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  badge_icon TEXT DEFAULT '🏅',
  description TEXT DEFAULT '',
  earned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(club_id, user_id, badge_type)
);

ALTER TABLE community_member_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Member badges visible to members" ON community_member_badges
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM club_members
      WHERE club_id = community_member_badges.club_id
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "Member badges insert system" ON community_member_badges
  FOR INSERT WITH CHECK (true);

-- ================================================================
-- PART 3: RPC FUNCTIONS
-- ================================================================

-- ----------------------------------------------------------------
-- RPC: Create default channels for a new club
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION create_default_chat_channels(
  p_club_id UUID,
  p_creator_id UUID
) RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO community_chat_channels (club_id, name, description, icon, is_default, position, created_by)
  VALUES
    (p_club_id, 'general', 'General discussion for the community', '💬', true, 0, p_creator_id),
    (p_club_id, 'announcements', 'Important announcements from owners', '📢', false, 1, p_creator_id),
    (p_club_id, 'training', 'Training tips and plans', '🏋️', false, 2, p_creator_id),
    (p_club_id, 'nutrition', 'Nutrition and meal planning', '🍎', false, 3, p_creator_id),
    (p_club_id, 'gear', 'Running gear reviews and recommendations', '👟', false, 4, p_creator_id),
    (p_club_id, 'photos', 'Share your running photos', '📸', false, 5, p_creator_id),
    (p_club_id, 'race-talk', 'Race results and upcoming races', '🏁', false, 6, p_creator_id);
END;
$$;

-- ----------------------------------------------------------------
-- RPC: Create community settings for a new club
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION create_community_settings(p_club_id UUID)
RETURNS UUID LANGUAGE plpgsql AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO community_settings (club_id)
  VALUES (p_club_id)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- ----------------------------------------------------------------
-- RPC: Increment/replace gallery likes count
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION increment_community_feed_likes(p_feed_id UUID, p_delta INTEGER)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  UPDATE community_feed
  SET likes_count = GREATEST(0, likes_count + p_delta)
  WHERE id = p_feed_id;
END;
$$;

-- ----------------------------------------------------------------
-- RPC: Increment/replace community run registered count
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION increment_community_run_count(p_run_id UUID, p_delta INTEGER)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  UPDATE community_runs
  SET registered_count = GREATEST(0, registered_count + p_delta)
  WHERE id = p_run_id;
END;
$$;

-- ----------------------------------------------------------------
-- RPC: Increment album photo count
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION increment_album_photo_count(p_album_id UUID, p_delta INTEGER)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  UPDATE community_albums
  SET photo_count = GREATEST(0, photo_count + p_delta)
  WHERE id = p_album_id;
END;
$$;

-- ----------------------------------------------------------------
-- RPC: Increment route completion count
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION increment_route_completion(p_route_id UUID)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  UPDATE community_routes
  SET times_completed = times_completed + 1
  WHERE id = p_route_id;
END;
$$;

-- ----------------------------------------------------------------
-- RPC: Update member community stats (called after activity creation)
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_community_member_stats(
  p_club_id UUID,
  p_user_id UUID,
  p_distance DOUBLE PRECISION,
  p_duration INTEGER,
  p_elevation DOUBLE PRECISION
) RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO community_member_stats (club_id, user_id, total_distance, total_runs, total_duration, total_elevation, last_run_at, updated_at)
  VALUES (p_club_id, p_user_id, p_distance, 1, p_duration, p_elevation, NOW(), NOW())
  ON CONFLICT (club_id, user_id) DO UPDATE SET
    total_distance = community_member_stats.total_distance + p_distance,
    total_runs = community_member_stats.total_runs + 1,
    total_duration = community_member_stats.total_duration + p_duration,
    total_elevation = community_member_stats.total_elevation + p_elevation,
    last_run_at = NOW(),
    updated_at = NOW();
END;
$$;

-- ----------------------------------------------------------------
-- RPC: Award community XP to a member
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION award_community_xp(
  p_club_id UUID,
  p_user_id UUID,
  p_xp INTEGER
) RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO community_member_stats (club_id, user_id, xp)
  VALUES (p_club_id, p_user_id, p_xp)
  ON CONFLICT (club_id, user_id) DO UPDATE SET
    xp = community_member_stats.xp + p_xp,
    updated_at = NOW();

  UPDATE club_members
  SET xp_in_community = xp_in_community + p_xp
  WHERE club_id = p_club_id AND user_id = p_user_id;
END;
$$;

-- ----------------------------------------------------------------
-- RPC: Get unread chat count for a user in a club
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_unread_chat_count(
  p_club_id UUID,
  p_user_id UUID,
  p_after TIMESTAMPTZ DEFAULT NULL
) RETURNS INTEGER LANGUAGE plpgsql AS $$
DECLARE
  v_count INTEGER;
  v_threshold TIMESTAMPTZ;
BEGIN
  IF p_after IS NULL THEN
    v_threshold := NOW() - INTERVAL '7 days';
  ELSE
    v_threshold := p_after;
  END IF;

  SELECT COUNT(*) INTO v_count
  FROM community_chat_messages
  WHERE club_id = p_club_id
    AND created_at > v_threshold
    AND user_id != p_user_id;

  RETURN v_count;
END;
$$;

-- ----------------------------------------------------------------
-- RPC: Get community stats summary
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_community_stats(p_club_id UUID)
RETURNS TABLE(
  total_members BIGINT,
  total_posts BIGINT,
  total_events BIGINT,
  total_challenges BIGINT,
  total_gallery_items BIGINT,
  total_chat_messages BIGINT,
  total_routes BIGINT,
  total_runs BIGINT,
  active_members_7d BIGINT,
  avg_weekly_distance DOUBLE PRECISION
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM club_members WHERE club_id = p_club_id)::BIGINT,
    (SELECT COUNT(*) FROM community_feed WHERE club_id = p_club_id)::BIGINT,
    (SELECT COUNT(*) FROM events WHERE club_id = p_club_id)::BIGINT,
    (SELECT COUNT(*) FROM community_challenges WHERE club_id = p_club_id AND is_active = true)::BIGINT,
    (SELECT COUNT(*) FROM community_gallery WHERE club_id = p_club_id)::BIGINT,
    (SELECT COUNT(*) FROM community_chat_messages WHERE club_id = p_club_id)::BIGINT,
    (SELECT COUNT(*) FROM community_routes WHERE club_id = p_club_id)::BIGINT,
    (SELECT COUNT(*) FROM community_runs WHERE club_id = p_club_id)::BIGINT,
    (SELECT COUNT(DISTINCT cms.user_id) FROM community_member_stats cms WHERE cms.club_id = p_club_id AND cms.last_run_at > NOW() - INTERVAL '7 days')::BIGINT,
    (SELECT COALESCE(AVG(cms.total_distance), 0) FROM community_member_stats cms WHERE cms.club_id = p_club_id)::DOUBLE PRECISION;
END;
$$;

-- ================================================================
-- PART 4: INDEXES
-- ================================================================

CREATE INDEX IF NOT EXISTS idx_community_feed_route ON community_feed(route_id) WHERE route_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_community_feed_achievement ON community_feed(achievement_id) WHERE achievement_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_chat_messages_channel ON community_chat_messages(channel_id) WHERE channel_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_chat_messages_pinned ON community_chat_messages(is_pinned) WHERE is_pinned = true;

-- ================================================================
-- PART 5: SEED DEFAULT CHANNELS FOR EXISTING CLUBS
-- ================================================================
-- This runs inline to create default channels for any clubs that exist
-- but don't have channels yet.
DO $$
DECLARE
  club_rec RECORD;
BEGIN
  FOR club_rec IN
    SELECT c.id, c.created_by_id
    FROM clubs c
    WHERE NOT EXISTS (
      SELECT 1 FROM community_chat_channels ch WHERE ch.club_id = c.id
    )
  LOOP
    PERFORM create_default_chat_channels(club_rec.id, club_rec.created_by_id);
  END LOOP;
END;
$$;

-- ================================================================
-- PART 6: SEED COMMUNITY SETTINGS FOR EXISTING CLUBS
-- ================================================================
DO $$
DECLARE
  club_rec RECORD;
BEGIN
  FOR club_rec IN
    SELECT c.id
    FROM clubs c
    WHERE NOT EXISTS (
      SELECT 1 FROM community_settings cs WHERE cs.club_id = c.id
    )
  LOOP
    PERFORM create_community_settings(club_rec.id);
  END LOOP;
END;
$$;
