-- ===========================================
-- ZERO6 — Seed Data
-- Run this AFTER the schema migration
-- ===========================================

-- ----------------------------------------------------------------
-- CHALLENGES
-- ----------------------------------------------------------------
INSERT INTO challenges (title, description, icon, type, target, unit, difficulty, reward, reward_xp, start_date, end_date) VALUES
('July 100K Challenge', 'Run 100 kilometers in July. Any pace, any terrain — just get it done!', '🎯', 'distance', 100, 'km', 'intermediate', 'Gold Distance Badge', 500, '2026-07-01', '2026-07-31'),
('30-Day Streak', 'Run every single day for 30 consecutive days. Minimum 1km per day counts.', '🔥', 'streak', 30, 'days', 'advanced', 'Streak Master Badge', 750, '2026-07-01', '2026-07-30'),
('Speed Week', 'Run a sub-5:00/km pace for at least 5km in a single run this week.', '⚡', 'pace', 5, 'min/km', 'intermediate', 'Speed Demon Badge', 300, '2026-07-07', '2026-07-13'),
('Elevation Explorer', 'Accumulate 2,000 meters of elevation gain across all your runs this month.', '⛰️', 'elevation', 2000, 'meters', 'advanced', 'Mountain Goat Badge', 600, '2026-07-01', '2026-07-31'),
('Social Runner', 'Complete 10 group runs with your clubs this month.', '👥', 'frequency', 10, 'group runs', 'beginner', 'Social Butterfly Badge', 250, '2026-07-01', '2026-07-31'),
('Marathon Month', 'Run a total marathon distance (42.195km) within any 7-day period.', '🏅', 'distance', 42.195, 'km', 'elite', 'Marathon Champion Badge', 1000, '2026-07-01', '2026-07-31');

-- ----------------------------------------------------------------
-- ACHIEVEMENTS
-- ----------------------------------------------------------------
INSERT INTO achievements (title, description, icon, category, target, xp_reward, rarity) VALUES
('First Steps', 'Complete your first run on ZERO6', '👟', 'distance', 1, 50, 'common'),
('10K Club', 'Run a total of 10 kilometers', '🎽', 'distance', 10, 100, 'common'),
('Century Runner', 'Run a total of 100 kilometers', '💯', 'distance', 100, 250, 'uncommon'),
('Marathon Finisher', 'Complete a marathon distance (42.195km) in a single run', '🏅', 'distance', 42.195, 500, 'rare'),
('Speed Demon', 'Run a kilometer in under 4 minutes', '⚡', 'speed', 240, 400, 'rare'),
('Week Warrior', 'Maintain a 7-day running streak', '🔥', 'consistency', 7, 150, 'common'),
('Month Master', 'Maintain a 30-day running streak', '🌟', 'consistency', 30, 500, 'rare'),
('Social Butterfly', 'Join 3 different running clubs', '🦋', 'social', 3, 200, 'uncommon'),
('Event Enthusiast', 'Register for 5 events', '🎪', 'events', 5, 300, 'uncommon'),
('Legend', 'Run a total of 1,000 kilometers', '👑', 'special', 1000, 1000, 'legendary');

-- ----------------------------------------------------------------
-- SAMPLE EVENTS
-- Note: Events require a valid organizer_id from the profiles table.
-- After a user signs up, create events through the app UI or run:
-- INSERT INTO events (...) VALUES (...) with a real organizer_id.
-- ----------------------------------------------------------------
