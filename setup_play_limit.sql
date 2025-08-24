-- Setup script for enhanced play limit functionality
-- Run this in your Supabase SQL editor

-- Step 1: Create the database function for atomic play limit checking
CREATE OR REPLACE FUNCTION check_and_enforce_play_limit(
  p_user_id UUID,
  p_game_id INTEGER,
  p_play_limit INTEGER
)
RETURNS TABLE(
  limit_reached BOOLEAN,
  current_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_count INTEGER;
BEGIN
  -- Get current play count for this user and game
  SELECT COUNT(*) INTO v_current_count
  FROM game_results
  WHERE user_id = p_user_id AND game_id = p_game_id;
  
  -- Return result
  RETURN QUERY SELECT 
    (v_current_count >= p_play_limit) as limit_reached,
    v_current_count as current_count;
END;
$$;

-- Step 2: Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION check_and_enforce_play_limit(UUID, INTEGER, INTEGER) TO authenticated;

-- Step 3: Verify the function was created successfully
SELECT 
  routine_name, 
  routine_type, 
  data_type 
FROM information_schema.routines 
WHERE routine_name = 'check_and_enforce_play_limit';

-- Step 4: Test the function (optional - replace with actual values)
-- SELECT * FROM check_and_enforce_play_limit('your-user-id-here', 1, 2);
