-- ===========================================
-- ZERO6 AI Coach Conversations Schema
-- Run this in Supabase SQL Editor
-- ===========================================

-- ----------------------------------------------------------------
-- COACH CONVERSATIONS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS coach_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Conversation',
  message_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coach_conversations_user_id ON coach_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_coach_conversations_updated_at ON coach_conversations(updated_at DESC);

-- ----------------------------------------------------------------
-- COACH MESSAGES
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS coach_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES coach_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coach_messages_conversation_id ON coach_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_coach_messages_user_id ON coach_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_coach_messages_created_at ON coach_messages(created_at ASC);

-- ================================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================================

-- Enable RLS on coach tables
ALTER TABLE coach_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_messages ENABLE ROW LEVEL SECURITY;

-- COACH CONVERSATIONS
CREATE POLICY "Users can view own conversations" ON coach_conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own conversations" ON coach_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own conversations" ON coach_conversations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own conversations" ON coach_conversations FOR DELETE USING (auth.uid() = user_id);

-- COACH MESSAGES
CREATE POLICY "Users can view own messages" ON coach_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own messages" ON coach_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ================================================================
-- TRIGGERS
-- ================================================================

-- Update updated_at timestamp for conversations
CREATE TRIGGER update_coach_conversations_updated_at BEFORE UPDATE ON coach_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Increment message count when a message is added
CREATE OR REPLACE FUNCTION increment_conversation_message_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE coach_conversations 
  SET message_count = message_count + 1,
      updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_message_count AFTER INSERT ON coach_messages
  FOR EACH ROW EXECUTE FUNCTION increment_conversation_message_count();

-- Decrement message count when a message is deleted
CREATE OR REPLACE FUNCTION decrement_conversation_message_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE coach_conversations 
  SET message_count = GREATEST(message_count - 1, 0),
      updated_at = NOW()
  WHERE id = OLD.conversation_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER decrement_message_count AFTER DELETE ON coach_messages
  FOR EACH ROW EXECUTE FUNCTION decrement_conversation_message_count();
