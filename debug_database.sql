-- Debug script to check database state
-- Run this in your Supabase SQL Editor

-- Check all game results for a specific user (replace with actual user_id)
SELECT 
  gr.id,
  gr.user_id,
  g.key as game_key,
  gr.score,
  gr.created_at,
  gr.details
FROM game_results gr
JOIN games g ON gr.game_id = g.id
WHERE gr.user_id = 'f094053a-e89e-49a1-8969-ab009677c2f2'  -- Replace with your user_id
ORDER BY gr.created_at DESC;

-- Check count by game
SELECT 
  g.key as game_key,
  COUNT(*) as total_plays,
  MAX(gr.created_at) as last_play
FROM game_results gr
JOIN games g ON gr.game_id = g.id
WHERE gr.user_id = 'f094053a-e89e-49a1-8969-ab009677c2f2'  -- Replace with your user_id
GROUP BY g.key
ORDER BY g.key;

-- Check game settings
SELECT * FROM game_settings WHERE game_key = 'guess';

-- Test the function manually
SELECT * FROM check_and_enforce_play_limit(
  'f094053a-e89e-49a1-8969-ab009677c2f2'::UUID,  -- Replace with your user_id
  '9a320528-bd31-4310-8e71-aab4108747f6'::UUID,  -- Replace with your game_id
  2
);
