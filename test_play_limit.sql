-- Test script to verify play limit functionality
-- Run this in your Supabase SQL editor

-- Step 1: Check if the function exists
SELECT 
  routine_name, 
  routine_type, 
  data_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_name = 'check_and_enforce_play_limit';

-- Step 2: Check current game settings
SELECT * FROM game_settings ORDER BY game_key;

-- Step 3: Check current game results count for today (replace with actual user_id)
-- SELECT 
--   gr.user_id,
--   g.key as game_key,
--   COUNT(*) as play_count_today
-- FROM game_results gr
-- JOIN games g ON gr.game_id = g.id
-- WHERE DATE(gr.created_at) = CURRENT_DATE
-- GROUP BY gr.user_id, g.key
-- ORDER BY gr.user_id, g.key;

-- Step 4: Test the function manually (replace with actual values)
-- SELECT * FROM check_and_enforce_play_limit(
--   'your-user-id-here'::UUID, 
--   'your-game-id-here'::UUID, -- Use actual game UUID from games table
--   2  -- play_limit
-- );

-- Step 5: Check if there are any RLS policies blocking the function
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'game_results';

-- Step 6: Check today's game results
SELECT 
  gr.user_id,
  g.key as game_key,
  gr.score,
  gr.created_at,
  DATE(gr.created_at) as play_date
FROM game_results gr
JOIN games g ON gr.game_id = g.id
WHERE DATE(gr.created_at) = CURRENT_DATE
ORDER BY gr.created_at DESC;
