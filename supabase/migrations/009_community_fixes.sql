-- ================================================================
-- ZERO6 — Community System Fixes
-- 1. Add 'owner' role to club_members CHECK constraint
-- 2. Notifications table for community events
-- 3. Join requests table for private communities
-- 4. Fix RLS policies
-- ================================================================

-- ----------------------------------------------------------------
-- 1. Alter club_members role CHECK to include 'owner'
-- ----------------------------------------------------------------
ALTER TABLE club_members DROP CONSTRAINT IF EXISTS club_members_role_check;
ALTER TABLE club_members ADD CONSTRAINT club_members_role_check
  CHECK (role IN ('owner', 'moderator', 'member'));

UPDATE club_members SET role = 'owner' WHERE role = 'admin';

-- ----------------------------------------------------------------
-- 2. Notifications table
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS community_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- join_request, join_accepted, join_rejected, new_event, new_challenge, announcement, mention, comment, like, badge_earned, event_reminder
  title TEXT NOT NULL,
  body TEXT,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_community_notifications_user ON community_notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_notifications_club ON community_notifications(club_id);

ALTER TABLE community_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Notifications select own" ON community_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Notifications insert system" ON community_notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Notifications update own" ON community_notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- ----------------------------------------------------------------
-- 3. Club join requests (for private communities)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS club_join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(club_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_join_requests_club ON club_join_requests(club_id, status);

ALTER TABLE club_join_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Join requests select club_owners" ON club_join_requests
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM club_members WHERE club_id = club_join_requests.club_id AND user_id = auth.uid() AND role IN ('owner', 'moderator'))
    OR auth.uid() = user_id
  );

CREATE POLICY "Join requests insert own" ON club_join_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Join requests update owners" ON club_join_requests
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM club_members WHERE club_id = club_join_requests.club_id AND user_id = auth.uid() AND role IN ('owner', 'moderator'))
  );

-- ----------------------------------------------------------------
-- 4. Add join_type column to clubs
-- ----------------------------------------------------------------
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS join_type TEXT NOT NULL DEFAULT 'public' CHECK (join_type IN ('public', 'private'));

-- ----------------------------------------------------------------
-- 5. RPC: Create notification
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION create_community_notification(
  p_club_id UUID,
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_body TEXT DEFAULT NULL,
  p_data JSONB DEFAULT '{}'
) RETURNS UUID LANGUAGE plpgsql AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO community_notifications (club_id, user_id, type, title, body, data)
  VALUES (p_club_id, p_user_id, p_type, p_title, p_body, p_data)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;
