-- ===========================================
-- ZERO6 — Activity Comments + Counter RPCs
-- Run this AFTER 001_schema.sql
-- ===========================================

-- ----------------------------------------------------------------
-- ACTIVITY COMMENTS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activity_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_comments_activity ON activity_comments(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_comments_user ON activity_comments(user_id);

ALTER TABLE activity_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments are viewable by everyone" ON activity_comments FOR SELECT USING (true);
CREATE POLICY "Users can comment" ON activity_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON activity_comments FOR DELETE USING (auth.uid() = user_id);

-- ----------------------------------------------------------------
-- RPC: increment activity comments count
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION increment_activity_comments_count(p_activity_id UUID, p_delta INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE activities SET comments_count = GREATEST(comments_count + p_delta, 0) WHERE id = p_activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------
-- RPC: increment activity likes count
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION increment_activity_likes_count(p_activity_id UUID, p_delta INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE activities SET likes_count = GREATEST(likes_count + p_delta, 0) WHERE id = p_activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------
-- RPC: update follow counts on profiles
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_follow_counts(p_follower_id UUID, p_following_id UUID, p_delta INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles SET following_count = GREATEST(following_count + p_delta, 0) WHERE id = p_follower_id;
  UPDATE profiles SET followers_count = GREATEST(followers_count + p_delta, 0) WHERE id = p_following_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
