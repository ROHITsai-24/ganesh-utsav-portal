-- Fix database function conflict
-- This will remove the old INTEGER version and create a clean UUID version

-- Step 1: Drop ALL versions of the function to avoid conflicts
DROP FUNCTION IF EXISTS check_and_enforce_play_limit(UUID, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS check_and_enforce_play_limit(UUID, UUID, INTEGER);

-- Step 2: Create the clean function with UUID support
CREATE OR REPLACE FUNCTION check_and_enforce_play_limit(
  p_user_id UUID,
  p_game_id UUID,
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
  -- Get total play count for this user and game (ALL TIME)
  SELECT COUNT(*) INTO v_current_count
  FROM game_results
  WHERE user_id = p_user_id 
    AND game_id = p_game_id;
  
  -- Return result
  RETURN QUERY SELECT 
    (v_current_count >= p_play_limit) as limit_reached,
    v_current_count as current_count;
END;
$$;

-- Step 3: Grant execute permission
GRANT EXECUTE ON FUNCTION check_and_enforce_play_limit(UUID, UUID, INTEGER) TO authenticated;

-- Step 4: Verify the function was created correctly
SELECT 
  routine_name, 
  routine_type, 
  data_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_name = 'check_and_enforce_play_limit';
