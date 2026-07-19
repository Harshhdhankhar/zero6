-- ----------------------------------------------------------------
-- Followers table (missing from initial schema)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

ALTER TABLE followers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view followers" ON followers;
CREATE POLICY "Users can view followers" ON followers FOR SELECT
  USING (auth.uid() = follower_id OR auth.uid() = following_id);

DROP POLICY IF EXISTS "Authenticated users can follow" ON followers;
CREATE POLICY "Authenticated users can follow" ON followers FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "Users can unfollow" ON followers;
CREATE POLICY "Users can unfollow" ON followers FOR DELETE
  USING (auth.uid() = follower_id);

-- Index for faster lookups in RLS policies
CREATE INDEX IF NOT EXISTS idx_followers_follower_id ON followers(follower_id);
CREATE INDEX IF NOT EXISTS idx_followers_following_id ON followers(following_id);
