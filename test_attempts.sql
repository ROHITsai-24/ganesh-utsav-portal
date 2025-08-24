-- Test script to verify attempts tracking
-- Run this in your Supabase SQL Editor

-- Check current game results with attempts
SELECT 
  gr.id,
  gr.user_id,
  g.key as game_key,
  gr.score,
  gr.details->>'attempts' as attempts,
  gr.created_at
FROM game_results gr
JOIN games g ON gr.game_id = g.id
WHERE gr.user_id = 'f094053a-e89e-49a1-8969-ab009677c2f2'  -- Replace with your user_id
ORDER BY gr.created_at DESC;

-- Test the function with attempts counting
SELECT * FROM check_and_enforce_play_limit(
  'f094053a-e89e-49a1-8969-ab009677c2f2'::UUID,  -- Replace with your user_id
  '9a320528-bd31-4310-8e71-aab4108747f6'::UUID,  -- Replace with your game_id
  2
);

-- Check total attempts by game
SELECT 
  g.key as game_key,
  SUM((gr.details->>'attempts')::INTEGER) as total_attempts,
  COUNT(*) as total_records
FROM game_results gr
JOIN games g ON gr.game_id = g.id
WHERE gr.user_id = 'f094053a-e89e-49a1-8969-ab009677c2f2'  -- Replace with your user_id
GROUP BY g.key
ORDER BY g.key;
