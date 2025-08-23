-- Game settings table for admin control
CREATE TABLE IF NOT EXISTS game_settings (
  id SERIAL PRIMARY KEY,
  game_key TEXT UNIQUE NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings for existing games
INSERT INTO game_settings (game_key, is_enabled) VALUES 
  ('puzzle', true),
  ('guess', true)
ON CONFLICT (game_key) DO NOTHING;

-- Add RLS policies for game_settings
ALTER TABLE game_settings ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users (for checking if games are enabled)
CREATE POLICY "Allow read access to game settings" ON game_settings
  FOR SELECT USING (true);

-- Allow admin to update game settings
CREATE POLICY "Allow admin to update game settings" ON game_settings
  FOR UPDATE USING (auth.jwt() ->> 'email' = current_setting('app.admin_email', true));

-- Allow admin to insert game settings
CREATE POLICY "Allow admin to insert game settings" ON game_settings
  FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = current_setting('app.admin_email', true));
