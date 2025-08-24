-- Fix play limit function to count actual attempts
-- This will count attempts from the details field, not just records

-- Step 1: Drop the old function
DROP FUNCTION IF EXISTS check_and_enforce_play_limit(UUID, UUID, INTEGER);

-- Step 2: Create the new function that counts attempts
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
  -- Get total attempts from the details field
  SELECT COALESCE(SUM((details->>'attempts')::INTEGER), 0) INTO v_current_count
  FROM game_results
  WHERE user_id = p_user_id 
    AND game_id = p_game_id;
  
  -- Return result (current_count is the existing attempts, not including current attempt)
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
  data_type
FROM information_schema.routines 
WHERE routine_name = 'check_and_enforce_play_limit';
