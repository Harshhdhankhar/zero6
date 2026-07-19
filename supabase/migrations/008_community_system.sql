-- ================================================================
-- ZERO6 — Community System (Phase 3)
-- Tables for feed, challenges, gallery, files, chat, QR check-in
-- ================================================================

-- ----------------------------------------------------------------
-- 1. Enhance clubs table with discovery columns
-- ----------------------------------------------------------------
ALTER TABLE clubs
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS running_type TEXT DEFAULT 'road',
  ADD COLUMN IF NOT EXISTS next_run TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rating DOUBLE PRECISION DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_women_only BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_beginner_friendly BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS morning_runs BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS evening_runs BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS active_members_today INTEGER DEFAULT 0;

-- ----------------------------------------------------------------
-- 2. Community Feed
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS community_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT,
  image_url TEXT,
  video_url TEXT,
  activity_id UUID, -- shared run/activity
  post_type TEXT NOT NULL DEFAULT 'post', -- post, announcement, achievement, run_share
  is_pinned BOOLEAN DEFAULT false,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_community_feed_club ON community_feed(club_id, created_at DESC);

ALTER TABLE community_feed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Feed select public" ON community_feed
  FOR SELECT USING (true);

CREATE POLICY "Feed insert own" ON community_feed
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Feed delete own or admin" ON community_feed
  FOR DELETE USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM club_members
      WHERE club_id = community_feed.club_id
        AND user_id = auth.uid()
        AND role IN ('admin', 'moderator')
    )
  );

-- ----------------------------------------------------------------
-- 3. Feed Comments
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS feed_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_id UUID NOT NULL REFERENCES community_feed(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES feed_comments(id) ON DELETE CASCADE, -- for replies
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feed_comments_feed ON feed_comments(feed_id, created_at);

ALTER TABLE feed_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments select public" ON feed_comments FOR SELECT USING (true);
CREATE POLICY "Comments insert own" ON feed_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Comments delete own" ON feed_comments FOR DELETE USING (auth.uid() = user_id);

-- ----------------------------------------------------------------
-- 4. Feed Likes / Reactions
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS feed_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_id UUID NOT NULL REFERENCES community_feed(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reaction_type TEXT DEFAULT 'like', -- like, love, fire, cheers, wow
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(feed_id, user_id)
);

ALTER TABLE feed_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Likes select public" ON feed_likes FOR SELECT USING (true);
CREATE POLICY "Likes insert own" ON feed_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Likes delete own" ON feed_likes FOR DELETE USING (auth.uid() = user_id);

-- ----------------------------------------------------------------
-- 5. Community Challenges
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS community_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  challenge_type TEXT NOT NULL DEFAULT 'distance', -- distance, runs, streak, elevation, pace
  goal_value DOUBLE PRECISION NOT NULL,
  goal_unit TEXT NOT NULL DEFAULT 'km',
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  icon TEXT DEFAULT '🏃',
  difficulty TEXT DEFAULT 'beginner', -- beginner, intermediate, advanced, elite
  participants_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_community_challenges_club ON community_challenges(club_id, is_active);

ALTER TABLE community_challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Challenges select public" ON community_challenges FOR SELECT USING (true);
CREATE POLICY "Challenges insert club_admin" ON community_challenges FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM club_members
    WHERE club_id = community_challenges.club_id
      AND user_id = auth.uid()
      AND role IN ('admin', 'moderator')
  )
);

-- ----------------------------------------------------------------
-- 6. Challenge Participants
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS challenge_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES community_challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  progress DOUBLE PRECISION DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(challenge_id, user_id)
);

ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "CP select public" ON challenge_participants FOR SELECT USING (true);
CREATE POLICY "CP insert own" ON challenge_participants FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------
-- 7. Community Gallery
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS community_gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  media_type TEXT DEFAULT 'photo', -- photo, video
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_community_gallery_club ON community_gallery(club_id, created_at DESC);

ALTER TABLE community_gallery ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Gallery select public" ON community_gallery FOR SELECT USING (true);
CREATE POLICY "Gallery insert own" ON community_gallery FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Gallery delete own" ON community_gallery FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS community_gallery_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id UUID NOT NULL REFERENCES community_gallery(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(gallery_id, user_id)
);

ALTER TABLE community_gallery_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "GL select public" ON community_gallery_likes FOR SELECT USING (true);
CREATE POLICY "GL insert own" ON community_gallery_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "GL delete own" ON community_gallery_likes FOR DELETE USING (auth.uid() = user_id);

-- ----------------------------------------------------------------
-- 8. Community Files
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS community_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'pdf', -- pdf, doc, xls, image, map
  file_size INTEGER,
  category TEXT DEFAULT 'training', -- training, nutrition, waivers, maps, other
  downloads_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_community_files_club ON community_files(club_id, created_at DESC);

ALTER TABLE community_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Files select public" ON community_files FOR SELECT USING (true);
CREATE POLICY "Files insert admin" ON community_files FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM club_members
    WHERE club_id = community_files.club_id
      AND user_id = auth.uid()
      AND role IN ('admin', 'moderator')
  )
);

-- ----------------------------------------------------------------
-- 9. Community Chat
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS community_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT,
  image_url TEXT,
  gif_url TEXT,
  reply_to UUID REFERENCES community_chat_messages(id) ON DELETE SET NULL,
  is_announcement BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,
  mentions UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_club ON community_chat_messages(club_id, created_at DESC);

ALTER TABLE community_chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Chat select members" ON community_chat_messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM club_members
    WHERE club_id = community_chat_messages.club_id
      AND user_id = auth.uid()
  )
);
CREATE POLICY "Chat insert members" ON community_chat_messages FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM club_members
    WHERE club_id = community_chat_messages.club_id
      AND user_id = auth.uid()
  )
);

-- ----------------------------------------------------------------
-- 10. QR Codes for Events
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS qr_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  is_scanned BOOLEAN DEFAULT false,
  scanned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_qr_codes_event ON qr_codes(event_id);

ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "QR select own" ON qr_codes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "QR insert own" ON qr_codes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------
-- RPC: Increment feed likes count
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION increment_feed_likes(p_feed_id UUID, p_delta INTEGER)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  UPDATE community_feed SET likes_count = GREATEST(0, likes_count + p_delta) WHERE id = p_feed_id;
END;
$$;

-- ----------------------------------------------------------------
-- RPC: Increment feed comments count
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION increment_feed_comments(p_feed_id UUID, p_delta INTEGER)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  UPDATE community_feed SET comments_count = GREATEST(0, comments_count + p_delta) WHERE id = p_feed_id;
END;
$$;

-- ----------------------------------------------------------------
-- RPC: Increment challenge participants count
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION increment_challenge_participants(p_challenge_id UUID, p_delta INTEGER)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  UPDATE community_challenges SET participants_count = GREATEST(0, participants_count + p_delta) WHERE id = p_challenge_id;
END;
$$;

-- ----------------------------------------------------------------
-- RPC: Increment gallery likes count
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION increment_gallery_likes(p_gallery_id UUID, p_delta INTEGER)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  UPDATE community_gallery SET likes_count = GREATEST(0, likes_count + p_delta) WHERE id = p_gallery_id;
END;
$$;
