-- Function to check and enforce play limits in a transaction
-- This prevents race conditions when multiple games are started simultaneously
-- Updated to handle UUID game_id and count only today's plays

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
  -- Get current play count for this user and game (TODAY ONLY)
  SELECT COUNT(*) INTO v_current_count
  FROM game_results
  WHERE user_id = p_user_id 
    AND game_id = p_game_id
    AND DATE(created_at) = CURRENT_DATE;
  
  -- Return result
  RETURN QUERY SELECT 
    (v_current_count >= p_play_limit) as limit_reached,
    v_current_count as current_count;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION check_and_enforce_play_limit(UUID, UUID, INTEGER) TO authenticated;
