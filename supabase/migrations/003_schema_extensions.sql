-- ===========================================
-- ZERO6 — Schema Extensions (Phase 2)
-- Run this AFTER 001_schema.sql and 002_comments.sql
-- ===========================================

-- ================================================================
-- PART 1: MISSING COLUMNS ON EXISTING TABLES
-- ================================================================

-- PROFILES
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS daily_goal DOUBLE PRECISION NOT NULL DEFAULT 5.0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS weekly_goal DOUBLE PRECISION NOT NULL DEFAULT 35.0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banner_image TEXT DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT NOW();

-- ACTIVITIES
ALTER TABLE activities ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE activities ADD COLUMN IF NOT EXISTS weather JSONB DEFAULT '{}'::jsonb;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'gps', 'import_strava', 'import_garmin'));
ALTER TABLE activities ADD COLUMN IF NOT EXISTS original_session_id UUID;

-- CLUBS
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS join_type TEXT NOT NULL DEFAULT 'open' CHECK (join_type IN ('open', 'approval'));
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS rules TEXT DEFAULT '';
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb;

-- EVENTS
ALTER TABLE events ADD COLUMN IF NOT EXISTS club_id UUID REFERENCES clubs(id) ON DELETE SET NULL;
ALTER TABLE events ADD COLUMN IF NOT EXISTS registration_deadline TIMESTAMPTZ;
ALTER TABLE events ADD COLUMN IF NOT EXISTS check_in_code TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS results JSONB DEFAULT '[]'::jsonb;
ALTER TABLE events ADD COLUMN IF NOT EXISTS route_geometry JSONB DEFAULT '[]'::jsonb;
ALTER TABLE events ADD COLUMN IF NOT EXISTS organizer_notes TEXT DEFAULT '';

-- CHALLENGES
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS rules TEXT DEFAULT '';
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- CHALLENGE PARTICIPANTS
ALTER TABLE challenge_participants ADD COLUMN IF NOT EXISTS completed BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE challenge_participants ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- NOTIFICATIONS
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}'::jsonb;

-- MESSAGES
ALTER TABLE messages ADD COLUMN IF NOT EXISTS conversation_id UUID;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_url TEXT DEFAULT '';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system'));

-- REWARD REDEMPTIONS
ALTER TABLE reward_redemptions ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'fulfilled', 'cancelled'));
ALTER TABLE reward_redemptions ADD COLUMN IF NOT EXISTS reward_name TEXT DEFAULT '';

-- USER ACHIEVEMENTS
ALTER TABLE user_achievements ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ACTIVITY COMMENTS
ALTER TABLE activity_comments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE activity_comments ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES activity_comments(id) ON DELETE CASCADE;

-- ================================================================
-- PART 2: MISSING TABLES
-- ================================================================

-- ----------------------------------------------------------------
-- REWARDS CATALOG
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rewards_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  image TEXT DEFAULT '',
  category TEXT NOT NULL DEFAULT 'badge' CHECK (category IN ('badge', 'coupon', 'merch', 'digital', 'experience')),
  cost INTEGER NOT NULL CHECK (cost > 0),
  quantity INTEGER NOT NULL DEFAULT -1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- CONVERSATIONS (for grouped messaging)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT DEFAULT '',
  is_group BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

-- ----------------------------------------------------------------
-- GPS RUN TRACKING
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS run_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  duration INTEGER DEFAULT 0,
  distance DOUBLE PRECISION DEFAULT 0,
  pace DOUBLE PRECISION DEFAULT 0,
  calories INTEGER DEFAULT 0,
  elevation_gain DOUBLE PRECISION DEFAULT 0,
  elevation_loss DOUBLE PRECISION DEFAULT 0,
  avg_heart_rate INTEGER,
  max_heart_rate INTEGER,
  avg_cadence INTEGER,
  route JSONB DEFAULT '[]'::jsonb,
  splits JSONB DEFAULT '[]'::jsonb,
  pace_history JSONB DEFAULT '[]'::jsonb,
  distance_history JSONB DEFAULT '[]'::jsonb,
  activity_id UUID REFERENCES activities(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tracking_waypoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES run_sessions(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  altitude DOUBLE PRECISION DEFAULT 0,
  accuracy DOUBLE PRECISION DEFAULT 0,
  speed DOUBLE PRECISION DEFAULT 0,
  heart_rate INTEGER,
  cadence INTEGER,
  pace DOUBLE PRECISION DEFAULT 0,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_waypoints_session ON tracking_waypoints(session_id, timestamp);

-- ----------------------------------------------------------------
-- AI COACH PERSISTENCE
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS coach_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Conversation',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS coach_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES coach_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coach_messages_conv ON coach_messages(conversation_id, created_at);

CREATE TABLE IF NOT EXISTS training_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  duration_weeks INTEGER NOT NULL DEFAULT 8,
  weekly_mileage DOUBLE PRECISION[] DEFAULT '{}',
  plan JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- USER GOALS & PREFERENCES
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('distance', 'duration', 'frequency', 'streak', 'elevation', 'pace', 'custom')),
  target DOUBLE PRECISION NOT NULL,
  unit TEXT NOT NULL DEFAULT 'km',
  period TEXT NOT NULL DEFAULT 'weekly' CHECK (period IN ('daily', 'weekly', 'monthly', 'yearly', 'custom')),
  title TEXT DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_goals_user ON user_goals(user_id);

-- ----------------------------------------------------------------
-- CLUB JOIN REQUESTS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS club_join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  UNIQUE(club_id, user_id)
);

-- ----------------------------------------------------------------
-- SAVED ITEMS (bookmarks)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS saved_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('event', 'club', 'route', 'activity', 'challenge', 'user')),
  item_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, item_type, item_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_items_user ON saved_items(user_id, item_type);

-- ----------------------------------------------------------------
-- SAVED ROUTES
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS saved_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  distance DOUBLE PRECISION NOT NULL DEFAULT 0,
  elevation_gain DOUBLE PRECISION DEFAULT 0,
  difficulty TEXT DEFAULT 'easy' CHECK (difficulty IN ('easy', 'moderate', 'hard')),
  location TEXT DEFAULT '',
  city TEXT DEFAULT '',
  coordinates JSONB DEFAULT '[]'::jsonb,
  image_url TEXT DEFAULT '',
  rating DOUBLE PRECISION DEFAULT 0,
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_routes_city ON saved_routes(city);
CREATE INDEX IF NOT EXISTS idx_saved_routes_featured ON saved_routes(is_featured) WHERE is_featured = true;

-- ----------------------------------------------------------------
-- EVENT CHECK-INS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS event_check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- ----------------------------------------------------------------
-- AUDIT LOGS (admin)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_admin ON audit_logs(admin_id, created_at DESC);

-- ================================================================
-- PART 3: MISSING INDEXES
-- ================================================================

-- Profiles
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_name ON profiles(name);
CREATE INDEX IF NOT EXISTS idx_profiles_total_distance ON profiles(total_distance DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at DESC);

-- Activities
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type);
CREATE INDEX IF NOT EXISTS idx_activities_user_created ON activities(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_date ON activities(created_at);

-- Clubs
CREATE INDEX IF NOT EXISTS idx_clubs_name ON clubs(name);

-- Events
CREATE INDEX IF NOT EXISTS idx_events_title ON events(title);
CREATE INDEX IF NOT EXISTS idx_events_organizer ON events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);

-- Event Registrations
CREATE INDEX IF NOT EXISTS idx_event_registrations_user ON event_registrations(user_id);

-- Challenges
CREATE INDEX IF NOT EXISTS idx_challenges_dates ON challenges(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_challenges_type ON challenges(type);

-- Challenge Participants
CREATE INDEX IF NOT EXISTS idx_challenge_participants_user ON challenge_participants(user_id);

-- User Achievements
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Messages
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_unread ON messages(receiver_id, is_read) WHERE is_read = false;

-- Activity Comments
CREATE INDEX IF NOT EXISTS idx_activity_comments_created_at ON activity_comments(activity_id, created_at ASC);

-- ================================================================
-- PART 4: MISSING RPC FUNCTIONS
-- ================================================================

-- RPC: Distribute XP and update level
CREATE OR REPLACE FUNCTION distribute_reward_xp(p_user_id UUID, p_amount INTEGER)
RETURNS VOID AS $$
DECLARE
  current_xp INTEGER;
  current_level INTEGER;
  xp_needed INTEGER;
BEGIN
  SELECT xp, level, xp_to_next_level INTO current_xp, current_level, xp_needed
  FROM profiles WHERE id = p_user_id;

  current_xp := current_xp + p_amount;

  WHILE current_xp >= xp_needed LOOP
    current_xp := current_xp - xp_needed;
    current_level := current_level + 1;
    xp_needed := current_level * 1000;
  END LOOP;

  UPDATE profiles
  SET xp = current_xp,
      level = current_level,
      xp_to_next_level = xp_needed
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Update streak based on activity dates
CREATE OR REPLACE FUNCTION update_streaks(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  activity_dates DATE[];
  last_date DATE;
  current_streak_val INTEGER := 0;
  longest_streak_val INTEGER;
  i INTEGER;
BEGIN
  SELECT array_agg(DISTINCT created_at::DATE ORDER BY created_at::DATE DESC)
  INTO activity_dates
  FROM activities
  WHERE user_id = p_user_id;

  IF activity_dates IS NULL OR array_length(activity_dates, 1) = 0 THEN
    UPDATE profiles SET current_streak = 0 WHERE id = p_user_id;
    RETURN;
  END IF;

  last_date := activity_dates[1];

  IF last_date < CURRENT_DATE - INTERVAL '2 days' THEN
    current_streak_val := 0;
  ELSE
    current_streak_val := 1;
    FOR i IN 2..array_length(activity_dates, 1) LOOP
      IF activity_dates[i-1] - activity_dates[i] = 1 THEN
        current_streak_val := current_streak_val + 1;
      ELSE
        EXIT;
      END IF;
    END LOOP;
  END IF;

  SELECT longest_streak INTO longest_streak_val FROM profiles WHERE id = p_user_id;
  IF current_streak_val > longest_streak_val THEN
    longest_streak_val := current_streak_val;
  END IF;

  UPDATE profiles
  SET current_streak = current_streak_val,
      longest_streak = GREATEST(longest_streak, longest_streak_val)
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Check and award achievements
CREATE OR REPLACE FUNCTION check_and_award_achievements(p_user_id UUID)
RETURNS TABLE(achievement_id UUID, newly_unlocked BOOLEAN) AS $$
DECLARE
  user_total_distance DOUBLE PRECISION;
  user_total_runs INTEGER;
  user_fastest_5k DOUBLE PRECISION;
  user_fastest_10k DOUBLE PRECISION;
  user_longest_run DOUBLE PRECISION;
  ach RECORD;
  ua RECORD;
  is_new BOOLEAN;
BEGIN
  SELECT total_distance, total_runs INTO user_total_distance, user_total_runs
  FROM profiles WHERE id = p_user_id;

  FOR ach IN SELECT * FROM achievements LOOP
    SELECT * INTO ua FROM user_achievements
    WHERE user_id = p_user_id AND achievement_id = ach.id;

    is_new := false;

    IF ua.id IS NULL THEN
      INSERT INTO user_achievements (user_id, achievement_id, progress)
      VALUES (p_user_id, ach.id, 0)
      ON CONFLICT (user_id, achievement_id) DO NOTHING;

      SELECT * INTO ua FROM user_achievements
      WHERE user_id = p_user_id AND achievement_id = ach.id;
    END IF;

    IF ua.unlocked_at IS NULL THEN
      CASE ach.category
        WHEN 'distance' THEN
          UPDATE user_achievements SET progress = LEAST(user_total_distance / ach.target * 100, 100)
          WHERE id = ua.id;
          IF user_total_distance >= ach.target THEN
            UPDATE user_achievements SET unlocked_at = NOW() WHERE id = ua.id;
            PERFORM distribute_reward_xp(p_user_id, ach.xp_reward);
            is_new := true;
          END IF;
        WHEN 'speed' THEN
          NULL;
        WHEN 'consistency' THEN
          IF ua.progress IS NULL THEN
            UPDATE user_achievements SET progress = 0 WHERE id = ua.id;
          END IF;
        WHEN 'social' THEN
          IF ua.progress IS NULL THEN
            UPDATE user_achievements SET progress = 0 WHERE id = ua.id;
          END IF;
        ELSE
          IF ua.progress IS NULL THEN
            UPDATE user_achievements SET progress = 0 WHERE id = ua.id;
          END IF;
      END CASE;
    END IF;

    achievement_id := ach.id;
    newly_unlocked := is_new;
    RETURN NEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Check challenge completions
CREATE OR REPLACE FUNCTION check_challenge_completions(p_user_id UUID)
RETURNS TABLE(challenge_id UUID, completed_now BOOLEAN) AS $$
DECLARE
  chal RECORD;
  cp RECORD;
  user_total DOUBLE PRECISION;
  is_complete BOOLEAN;
BEGIN
  FOR chal IN SELECT * FROM challenges WHERE is_active = true
    AND CURRENT_DATE >= start_date::DATE AND CURRENT_DATE <= end_date::DATE
  LOOP
    SELECT * INTO cp FROM challenge_participants
    WHERE user_id = p_user_id AND challenge_id = chal.id;

    IF cp.id IS NULL THEN
      CONTINUE;
    END IF;

    IF cp.completed THEN
      challenge_id := chal.id;
      completed_now := false;
      RETURN NEXT;
      CONTINUE;
    END IF;

    CASE chal.type
      WHEN 'distance' THEN
        SELECT COALESCE(SUM(distance), 0) INTO user_total
        FROM activities
        WHERE user_id = p_user_id
          AND created_at >= chal.start_date
          AND created_at <= chal.end_date;

        UPDATE challenge_participants SET current = user_total WHERE id = cp.id;

        IF user_total >= chal.target THEN
          UPDATE challenge_participants SET completed = true, completed_at = NOW() WHERE id = cp.id;
          PERFORM distribute_reward_xp(p_user_id, chal.reward_xp);
          is_complete := true;
        ELSE
          is_complete := false;
        END IF;
      WHEN 'frequency' THEN
        SELECT COUNT(DISTINCT created_at::DATE) INTO user_total
        FROM activities
        WHERE user_id = p_user_id
          AND created_at >= chal.start_date
          AND created_at <= chal.end_date;

        UPDATE challenge_participants SET current = user_total WHERE id = cp.id;

        IF user_total >= chal.target THEN
          UPDATE challenge_participants SET completed = true, completed_at = NOW() WHERE id = cp.id;
          PERFORM distribute_reward_xp(p_user_id, chal.reward_xp);
          is_complete := true;
        ELSE
          is_complete := false;
        END IF;
      WHEN 'duration' THEN
        SELECT COALESCE(SUM(duration), 0) INTO user_total
        FROM activities
        WHERE user_id = p_user_id
          AND created_at >= chal.start_date
          AND created_at <= chal.end_date;

        UPDATE challenge_participants SET current = user_total WHERE id = cp.id;

        IF user_total >= chal.target THEN
          UPDATE challenge_participants SET completed = true, completed_at = NOW() WHERE id = cp.id;
          PERFORM distribute_reward_xp(p_user_id, chal.reward_xp);
          is_complete := true;
        ELSE
          is_complete := false;
        END IF;
      WHEN 'streak' THEN
        SELECT current_streak INTO user_total FROM profiles WHERE id = p_user_id;

        UPDATE challenge_participants SET current = user_total WHERE id = cp.id;

        IF user_total >= chal.target THEN
          UPDATE challenge_participants SET completed = true, completed_at = NOW() WHERE id = cp.id;
          PERFORM distribute_reward_xp(p_user_id, chal.reward_xp);
          is_complete := true;
        ELSE
          is_complete := false;
        END IF;
      WHEN 'elevation' THEN
        SELECT COALESCE(SUM(elevation_gain), 0) INTO user_total
        FROM activities
        WHERE user_id = p_user_id
          AND created_at >= chal.start_date
          AND created_at <= chal.end_date;

        UPDATE challenge_participants SET current = user_total WHERE id = cp.id;

        IF user_total >= chal.target THEN
          UPDATE challenge_participants SET completed = true, completed_at = NOW() WHERE id = cp.id;
          PERFORM distribute_reward_xp(p_user_id, chal.reward_xp);
          is_complete := true;
        ELSE
          is_complete := false;
        END IF;
      WHEN 'pace' THEN
        SELECT COALESCE(AVG(pace), 0) INTO user_total
        FROM activities
        WHERE user_id = p_user_id
          AND created_at >= chal.start_date
          AND created_at <= chal.end_date
          AND pace > 0;

        UPDATE challenge_participants SET current = user_total WHERE id = cp.id;

        IF chal.target > 0 AND user_total > 0 AND user_total <= chal.target THEN
          UPDATE challenge_participants SET completed = true, completed_at = NOW() WHERE id = cp.id;
          PERFORM distribute_reward_xp(p_user_id, chal.reward_xp);
          is_complete := true;
        ELSE
          is_complete := false;
        END IF;
      ELSE
        is_complete := false;
    END CASE;

    challenge_id := chal.id;
    completed_now := is_complete;
    RETURN NEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Get leaderboard with period and category
CREATE OR REPLACE FUNCTION get_leaderboard(
  p_period TEXT DEFAULT 'all',
  p_category TEXT DEFAULT 'distance',
  p_limit INTEGER DEFAULT 20,
  p_user_id UUID DEFAULT NULL
)
RETURNS TABLE(
  rank BIGINT,
  user_id UUID,
  name TEXT,
  username TEXT,
  avatar TEXT,
  value DOUBLE PRECISION,
  unit TEXT,
  change INTEGER
) AS $$
DECLARE
  date_filter TIMESTAMPTZ;
BEGIN
  CASE p_period
    WHEN 'week' THEN date_filter := date_trunc('week', NOW());
    WHEN 'month' THEN date_filter := date_trunc('month', NOW());
    WHEN 'year' THEN date_filter := date_trunc('year', NOW());
    ELSE date_filter := '1970-01-01'::TIMESTAMPTZ;
  END CASE;

  CASE p_category
    WHEN 'distance' THEN
      RETURN QUERY
      SELECT ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(a.distance), 0) DESC)::BIGINT,
             p.id, p.name, p.username, p.avatar,
             COALESCE(SUM(a.distance), 0)::DOUBLE PRECISION,
             'km'::TEXT, 0::INTEGER
      FROM profiles p
      LEFT JOIN activities a ON a.user_id = p.id AND a.created_at >= date_filter
      GROUP BY p.id
      ORDER BY COALESCE(SUM(a.distance), 0) DESC
      LIMIT p_limit;
    WHEN 'runs' THEN
      RETURN QUERY
      SELECT ROW_NUMBER() OVER (ORDER BY COUNT(a.id) DESC)::BIGINT,
             p.id, p.name, p.username, p.avatar,
             COUNT(a.id)::DOUBLE PRECISION,
             'runs'::TEXT, 0::INTEGER
      FROM profiles p
      LEFT JOIN activities a ON a.user_id = p.id AND a.created_at >= date_filter
      GROUP BY p.id
      ORDER BY COUNT(a.id) DESC
      LIMIT p_limit;
    WHEN 'duration' THEN
      RETURN QUERY
      SELECT ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(a.duration), 0) DESC)::BIGINT,
             p.id, p.name, p.username, p.avatar,
             COALESCE(SUM(a.duration), 0)::DOUBLE PRECISION,
             'minutes'::TEXT, 0::INTEGER
      FROM profiles p
      LEFT JOIN activities a ON a.user_id = p.id AND a.created_at >= date_filter
      GROUP BY p.id
      ORDER BY COALESCE(SUM(a.duration), 0) DESC
      LIMIT p_limit;
    WHEN 'streak' THEN
      RETURN QUERY
      SELECT ROW_NUMBER() OVER (ORDER BY p.current_streak DESC)::BIGINT,
             p.id, p.name, p.username, p.avatar,
             p.current_streak::DOUBLE PRECISION,
             'days'::TEXT, 0::INTEGER
      FROM profiles p
      ORDER BY p.current_streak DESC
      LIMIT p_limit;
    WHEN 'elevation' THEN
      RETURN QUERY
      SELECT ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(a.elevation_gain), 0) DESC)::BIGINT,
             p.id, p.name, p.username, p.avatar,
             COALESCE(SUM(a.elevation_gain), 0)::DOUBLE PRECISION,
             'm'::TEXT, 0::INTEGER
      FROM profiles p
      LEFT JOIN activities a ON a.user_id = p.id AND a.created_at >= date_filter
      GROUP BY p.id
      ORDER BY COALESCE(SUM(a.elevation_gain), 0) DESC
      LIMIT p_limit;
    WHEN 'xp' THEN
      RETURN QUERY
      SELECT ROW_NUMBER() OVER (ORDER BY p.xp DESC)::BIGINT,
             p.id, p.name, p.username, p.avatar,
             p.xp::DOUBLE PRECISION,
             'xp'::TEXT, 0::INTEGER
      FROM profiles p
      ORDER BY p.xp DESC
      LIMIT p_limit;
    ELSE
      RETURN QUERY
      SELECT ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(a.distance), 0) DESC)::BIGINT,
             p.id, p.name, p.username, p.avatar,
             COALESCE(SUM(a.distance), 0)::DOUBLE PRECISION,
             'km'::TEXT, 0::INTEGER
      FROM profiles p
      LEFT JOIN activities a ON a.user_id = p.id AND a.created_at >= date_filter
      GROUP BY p.id
      ORDER BY COALESCE(SUM(a.distance), 0) DESC
      LIMIT p_limit;
  END CASE;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- RPC: Get friends activity feed
CREATE OR REPLACE FUNCTION get_friends_activity(p_user_id UUID, p_limit INTEGER DEFAULT 20)
RETURNS TABLE(
  id UUID,
  user_id UUID,
  user_name TEXT,
  user_avatar TEXT,
  type TEXT,
  title TEXT,
  distance DOUBLE PRECISION,
  duration INTEGER,
  pace DOUBLE PRECISION,
  created_at TIMESTAMPTZ,
  likes_count INTEGER,
  comments_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT a.id, a.user_id, p.name, p.avatar,
         a.type, a.title, a.distance, a.duration, a.pace,
         a.created_at, a.likes_count, a.comments_count
  FROM activities a
  JOIN profiles p ON p.id = a.user_id
  WHERE a.user_id IN (
    SELECT following_id FROM follows WHERE follower_id = p_user_id
  )
  ORDER BY a.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- RPC: Recalculate user stats from activities
CREATE OR REPLACE FUNCTION recalculate_user_stats(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  total_dist DOUBLE PRECISION;
  total_run_count INTEGER;
  total_dur INTEGER;
BEGIN
  SELECT COALESCE(SUM(distance), 0),
         COUNT(*),
         COALESCE(SUM(duration), 0)
  INTO total_dist, total_run_count, total_dur
  FROM activities
  WHERE user_id = p_user_id;

  UPDATE profiles
  SET total_distance = total_dist,
      total_runs = total_run_count,
      total_duration = total_dur
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- PART 5: TRIGGER FUNCTIONS FOR AUTOMATED COUNTERS
-- ================================================================

-- Automatically update profile stats when activity is created
CREATE OR REPLACE FUNCTION trigger_update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET total_distance = total_distance + NEW.distance,
      total_runs = total_runs + 1,
      total_duration = total_duration + NEW.duration
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_activity_created ON activities;
CREATE TRIGGER on_activity_created
  AFTER INSERT ON activities
  FOR EACH ROW EXECUTE FUNCTION trigger_update_user_stats();

-- Automatically update streak when activity is created
CREATE OR REPLACE FUNCTION trigger_update_streak()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_streaks(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_activity_streak ON activities;
CREATE TRIGGER on_activity_streak
  AFTER INSERT ON activities
  FOR EACH ROW EXECUTE FUNCTION trigger_update_streak();

-- Automatically update updated_at on comments
CREATE OR REPLACE FUNCTION trigger_update_comment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_activity_comments_updated_at ON activity_comments;
CREATE TRIGGER update_activity_comments_updated_at
  BEFORE UPDATE ON activity_comments
  FOR EACH ROW EXECUTE FUNCTION trigger_update_comment_timestamp();

-- ================================================================
-- PART 6: MISSING RLS POLICIES
-- ================================================================

-- Enable RLS on new tables
ALTER TABLE rewards_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE run_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_waypoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- REWARDS CATALOG
CREATE POLICY "Rewards catalog viewable by everyone" ON rewards_catalog FOR SELECT USING (true);
CREATE POLICY "Admin can manage rewards" ON rewards_catalog FOR ALL USING (auth.uid() IN (
  SELECT id FROM profiles WHERE role = 'admin'
));

-- CONVERSATIONS
CREATE POLICY "Users can see own conversations" ON conversations FOR SELECT USING (
  auth.uid() IN (SELECT user_id FROM conversation_participants WHERE conversation_id = id)
);
CREATE POLICY "Users can create conversations" ON conversations FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Conversation participants can update" ON conversations FOR UPDATE USING (
  auth.uid() IN (SELECT user_id FROM conversation_participants WHERE conversation_id = id)
);

-- CONVERSATION PARTICIPANTS
CREATE POLICY "Participants viewable by members" ON conversation_participants FOR SELECT USING (
  auth.uid() IN (SELECT user_id FROM conversation_participants cp WHERE cp.conversation_id = conversation_participants.conversation_id)
);
CREATE POLICY "Users can join conversations" ON conversation_participants FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RUN SESSIONS
CREATE POLICY "Users can manage own run sessions" ON run_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Run sessions viewable by everyone" ON run_sessions FOR SELECT USING (true);

-- TRACKING WAYPOINTS
CREATE POLICY "Waypoints viewable by session owner" ON tracking_waypoints FOR SELECT USING (
  auth.uid() = (SELECT user_id FROM run_sessions WHERE id = session_id)
);
CREATE POLICY "Users can insert waypoints" ON tracking_waypoints FOR INSERT WITH CHECK (
  auth.uid() = (SELECT user_id FROM run_sessions WHERE id = session_id)
);

-- COACH CONVERSATIONS
CREATE POLICY "Users can manage own coach conversations" ON coach_conversations FOR ALL USING (auth.uid() = user_id);

-- COACH MESSAGES
CREATE POLICY "Users can see own coach messages" ON coach_messages FOR SELECT USING (
  auth.uid() = (SELECT user_id FROM coach_conversations WHERE id = conversation_id)
);
CREATE POLICY "Users can create coach messages" ON coach_messages FOR INSERT WITH CHECK (
  auth.uid() = (SELECT user_id FROM coach_conversations WHERE id = conversation_id)
);

-- TRAINING PLANS
CREATE POLICY "Users can manage own training plans" ON training_plans FOR ALL USING (auth.uid() = user_id);

-- USER GOALS
CREATE POLICY "Users can manage own goals" ON user_goals FOR ALL USING (auth.uid() = user_id);

-- CLUB JOIN REQUESTS
CREATE POLICY "Join requests viewable by club members" ON club_join_requests FOR SELECT USING (
  auth.uid() IN (SELECT user_id FROM club_members WHERE club_id = club_join_requests.club_id)
);
CREATE POLICY "Users can request to join" ON club_join_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage requests" ON club_join_requests FOR UPDATE USING (
  auth.uid() IN (SELECT user_id FROM club_members WHERE club_id = club_join_requests.club_id AND role IN ('admin', 'moderator'))
);

-- SAVED ITEMS
CREATE POLICY "Users can manage own saved items" ON saved_items FOR ALL USING (auth.uid() = user_id);

-- SAVED ROUTES
CREATE POLICY "Routes viewable by everyone" ON saved_routes FOR SELECT USING (true);
CREATE POLICY "Users can create routes" ON saved_routes FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creators can update own routes" ON saved_routes FOR UPDATE USING (auth.uid() = creator_id);

-- EVENT CHECK-INS
CREATE POLICY "Check-ins viewable by participants" ON event_check_ins FOR SELECT USING (
  auth.uid() = user_id OR
  auth.uid() = (SELECT organizer_id FROM events WHERE id = event_id)
);
CREATE POLICY "Users can check in" ON event_check_ins FOR INSERT WITH CHECK (auth.uid() = user_id);

-- AUDIT LOGS
CREATE POLICY "Audit logs viewable by admins" ON audit_logs FOR SELECT USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
);
CREATE POLICY "System can create audit logs" ON audit_logs FOR INSERT WITH CHECK (
  auth.uid() = admin_id
);

-- Fix notifications INSERT policy (was wide open)
DROP POLICY IF EXISTS "System can create notifications" ON notifications;
CREATE POLICY "System and sender can create notifications" ON notifications FOR INSERT WITH CHECK (
  auth.uid() = sender_id OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Add missing CRUD policies for challenges
CREATE POLICY "Anyone can insert challenges" ON challenges FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update challenges" ON challenges FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete challenges" ON challenges FOR DELETE USING (true);

-- Add missing policies for achievements
CREATE POLICY "Anyone can insert achievements" ON achievements FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update achievements" ON achievements FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete achievements" ON achievements FOR DELETE USING (true);

-- Add missing policies for challenge_participants
CREATE POLICY "Users can leave challenges" ON challenge_participants FOR DELETE USING (auth.uid() = user_id);

-- Add missing UPDATE for user_achievements
CREATE POLICY "Users can update own achievement progress" ON user_achievements FOR UPDATE USING (auth.uid() = user_id);

-- Add missing UPDATE for activity_comments
CREATE POLICY "Users can edit own comments" ON activity_comments FOR UPDATE USING (auth.uid() = user_id);

-- Add missing INSERT for profiles (for service role)
CREATE POLICY "System can create profiles" ON profiles FOR INSERT WITH CHECK (
  auth.uid() = id OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Add missing DELETE for profiles
CREATE POLICY "Users can delete own profile" ON profiles FOR DELETE USING (auth.uid() = id);

-- ================================================================
-- PART 7: ENABLE TRIGRAM EXTENSION FOR FASTER SEARCH
-- ================================================================
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_profiles_name_trgm ON profiles USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_profiles_username_trgm ON profiles USING GIN (username gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_clubs_name_trgm ON clubs USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_events_title_trgm ON events USING GIN (title gin_trgm_ops);
