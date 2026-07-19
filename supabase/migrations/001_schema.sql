-- ===========================================
-- ZERO6 — Database Schema Migration
-- Run this in Supabase SQL Editor
-- ===========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------
-- PROFILES (extends Supabase Auth users)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  username TEXT UNIQUE NOT NULL DEFAULT '',
  avatar TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  location TEXT DEFAULT '',
  role TEXT NOT NULL DEFAULT 'runner' CHECK (role IN ('admin', 'club_owner', 'runner', 'guest')),
  total_distance DOUBLE PRECISION NOT NULL DEFAULT 0,
  total_runs INTEGER NOT NULL DEFAULT 0,
  total_duration INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  xp INTEGER NOT NULL DEFAULT 0,
  xp_to_next_level INTEGER NOT NULL DEFAULT 1000,
  followers_count INTEGER NOT NULL DEFAULT 0,
  following_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      'user_' || substring(NEW.id::text from 1 for 8)
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ----------------------------------------------------------------
-- ACTIVITIES
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'run' CHECK (type IN ('run', 'walk', 'trail', 'treadmill')),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  distance DOUBLE PRECISION NOT NULL DEFAULT 0,
  duration INTEGER NOT NULL DEFAULT 0,
  pace DOUBLE PRECISION NOT NULL DEFAULT 0,
  calories INTEGER NOT NULL DEFAULT 0,
  elevation_gain DOUBLE PRECISION NOT NULL DEFAULT 0,
  heart_rate_avg INTEGER,
  heart_rate_max INTEGER,
  cadence_avg INTEGER,
  route JSONB DEFAULT '[]'::jsonb,
  splits JSONB DEFAULT '[]'::jsonb,
  likes_count INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0,
  map_image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at DESC);

-- ----------------------------------------------------------------
-- ACTIVITY LIKES
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activity_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(activity_id, user_id)
);

-- ----------------------------------------------------------------
-- CLUBS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  avatar TEXT DEFAULT '',
  cover_image TEXT DEFAULT '',
  location TEXT DEFAULT '',
  category TEXT NOT NULL DEFAULT 'social' CHECK (category IN ('road', 'trail', 'track', 'social', 'competitive', 'casual')),
  tags TEXT[] DEFAULT '{}',
  created_by_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  member_count INTEGER NOT NULL DEFAULT 1,
  activity_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- CLUB MEMBERS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS club_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(club_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_club_members_user ON club_members(user_id);
CREATE INDEX IF NOT EXISTS idx_club_members_club ON club_members(club_id);

-- ----------------------------------------------------------------
-- EVENTS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  cover_image TEXT DEFAULT '',
  date TIMESTAMPTZ NOT NULL,
  time TEXT NOT NULL DEFAULT '07:00 AM',
  location TEXT NOT NULL DEFAULT '',
  distance DOUBLE PRECISION NOT NULL DEFAULT 0,
  type TEXT NOT NULL DEFAULT 'fun_run' CHECK (type IN ('5k', '10k', 'half_marathon', 'marathon', 'ultra', 'trail_race', 'fun_run', 'virtual')),
  max_participants INTEGER NOT NULL DEFAULT 100,
  price DOUBLE PRECISION NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
  tags TEXT[] DEFAULT '{}',
  organizer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  registered_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);

-- ----------------------------------------------------------------
-- EVENT REGISTRATIONS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- ----------------------------------------------------------------
-- CHALLENGES
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT '🏃',
  type TEXT NOT NULL DEFAULT 'distance' CHECK (type IN ('distance', 'duration', 'frequency', 'streak', 'elevation', 'pace')),
  target DOUBLE PRECISION NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'km',
  difficulty TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced', 'elite')),
  reward TEXT NOT NULL DEFAULT '',
  reward_xp INTEGER NOT NULL DEFAULT 100,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  participant_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- CHALLENGE PARTICIPANTS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS challenge_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  current DOUBLE PRECISION NOT NULL DEFAULT 0,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(challenge_id, user_id)
);

-- ----------------------------------------------------------------
-- ACHIEVEMENTS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT '🏅',
  category TEXT NOT NULL DEFAULT 'distance' CHECK (category IN ('distance', 'speed', 'consistency', 'social', 'events', 'special')),
  target DOUBLE PRECISION NOT NULL DEFAULT 0,
  xp_reward INTEGER NOT NULL DEFAULT 50,
  rarity TEXT NOT NULL DEFAULT 'common' CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary'))
);

-- ----------------------------------------------------------------
-- USER ACHIEVEMENTS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  progress DOUBLE PRECISION NOT NULL DEFAULT 0,
  unlocked_at TIMESTAMPTZ,
  UNIQUE(user_id, achievement_id)
);

-- ----------------------------------------------------------------
-- FOLLOWS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);

-- ----------------------------------------------------------------
-- NOTIFICATIONS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL DEFAULT 'system' CHECK (type IN ('like', 'comment', 'follow', 'achievement', 'challenge', 'event', 'club', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  avatar TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  action_url TEXT,
  sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_receiver ON notifications(receiver_id, is_read);

-- ----------------------------------------------------------------
-- MESSAGES
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(sender_id, receiver_id);

-- ----------------------------------------------------------------
-- REWARD REDEMPTIONS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reward_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reward_id TEXT NOT NULL,
  cost INTEGER NOT NULL CHECK (cost > 0),
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reward_redemptions_user ON reward_redemptions(user_id);

-- ================================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_redemptions ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- ACTIVITIES
CREATE POLICY "Activities are viewable by everyone" ON activities FOR SELECT USING (true);
CREATE POLICY "Users can insert own activities" ON activities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own activities" ON activities FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own activities" ON activities FOR DELETE USING (auth.uid() = user_id);

-- ACTIVITY LIKES
CREATE POLICY "Likes are viewable by everyone" ON activity_likes FOR SELECT USING (true);
CREATE POLICY "Users can like activities" ON activity_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike activities" ON activity_likes FOR DELETE USING (auth.uid() = user_id);

-- CLUBS
CREATE POLICY "Clubs are viewable by everyone" ON clubs FOR SELECT USING (true);
CREATE POLICY "Users can create clubs" ON clubs FOR INSERT WITH CHECK (auth.uid() = created_by_id);
CREATE POLICY "Club owners can update" ON clubs FOR UPDATE USING (auth.uid() = created_by_id);
CREATE POLICY "Club owners can delete" ON clubs FOR DELETE USING (auth.uid() = created_by_id);

-- CLUB MEMBERS
CREATE POLICY "Club members are viewable by everyone" ON club_members FOR SELECT USING (true);
CREATE POLICY "Users can join clubs" ON club_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave clubs" ON club_members FOR DELETE USING (auth.uid() = user_id);

-- EVENTS
CREATE POLICY "Events are viewable by everyone" ON events FOR SELECT USING (true);
CREATE POLICY "Users can create events" ON events FOR INSERT WITH CHECK (auth.uid() = organizer_id);
CREATE POLICY "Organizers can update events" ON events FOR UPDATE USING (auth.uid() = organizer_id);
CREATE POLICY "Organizers can delete events" ON events FOR DELETE USING (auth.uid() = organizer_id);

-- EVENT REGISTRATIONS
CREATE POLICY "Registrations are viewable by everyone" ON event_registrations FOR SELECT USING (true);
CREATE POLICY "Users can register for events" ON event_registrations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unregister" ON event_registrations FOR DELETE USING (auth.uid() = user_id);

-- CHALLENGES
CREATE POLICY "Challenges are viewable by everyone" ON challenges FOR SELECT USING (true);

-- CHALLENGE PARTICIPANTS
CREATE POLICY "Challenge participants are viewable" ON challenge_participants FOR SELECT USING (true);
CREATE POLICY "Users can join challenges" ON challenge_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON challenge_participants FOR UPDATE USING (auth.uid() = user_id);

-- ACHIEVEMENTS
CREATE POLICY "Achievements are viewable by everyone" ON achievements FOR SELECT USING (true);

-- USER ACHIEVEMENTS
CREATE POLICY "User achievements viewable by everyone" ON user_achievements FOR SELECT USING (true);
CREATE POLICY "System can create user achievements" ON user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- FOLLOWS
CREATE POLICY "Follows are viewable by everyone" ON follows FOR SELECT USING (true);
CREATE POLICY "Users can follow" ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow" ON follows FOR DELETE USING (auth.uid() = follower_id);

-- NOTIFICATIONS
CREATE POLICY "Users see own notifications" ON notifications FOR SELECT USING (auth.uid() = receiver_id);
CREATE POLICY "Users can mark own notifications read" ON notifications FOR UPDATE USING (auth.uid() = receiver_id);
CREATE POLICY "System can create notifications" ON notifications FOR INSERT WITH CHECK (true);

-- MESSAGES
CREATE POLICY "Users see own messages" ON messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can send messages" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Receivers can mark messages read" ON messages FOR UPDATE USING (auth.uid() = receiver_id);

-- REWARD REDEMPTIONS
CREATE POLICY "Users see own redemptions" ON reward_redemptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create redemptions" ON reward_redemptions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ================================================================
-- UTILITY FUNCTIONS
-- ================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_clubs_updated_at BEFORE UPDATE ON clubs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ================================================================
-- RPC FUNCTIONS (for atomic counter increments)
-- ================================================================

CREATE OR REPLACE FUNCTION increment_club_member_count(p_club_id UUID, p_delta INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE clubs SET member_count = GREATEST(member_count + p_delta, 0) WHERE id = p_club_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_event_registered_count(p_event_id UUID, p_delta INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE events SET registered_count = GREATEST(registered_count + p_delta, 0) WHERE id = p_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_challenge_participant_count(p_challenge_id UUID, p_delta INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE challenges SET participant_count = GREATEST(participant_count + p_delta, 0) WHERE id = p_challenge_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_user_stats(p_user_id UUID, p_distance DOUBLE PRECISION, p_duration INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET total_distance = total_distance + p_distance,
      total_runs = total_runs + 1,
      total_duration = total_duration + p_duration
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
