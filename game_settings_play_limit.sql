-- Add play_limit column to game_settings table
ALTER TABLE game_settings 
ADD COLUMN play_limit INTEGER DEFAULT 1;

-- Update existing records to have default play limit of 1
UPDATE game_settings 
SET play_limit = 1 
WHERE play_limit IS NULL;

-- Add constraint to ensure play_limit is at least 1
ALTER TABLE game_settings 
ADD CONSTRAINT check_play_limit 
CHECK (play_limit >= 1);
