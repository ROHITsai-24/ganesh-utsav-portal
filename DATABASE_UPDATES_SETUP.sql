-- Create updates table for admin messages
CREATE TABLE IF NOT EXISTS updates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message TEXT NOT NULL,
  title VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE updates ENABLE ROW LEVEL SECURITY;

-- Create policy to allow admin to insert/update/delete updates
CREATE POLICY "Admin can manage updates" ON updates 
  FOR ALL USING (
    auth.jwt() ->> 'email' = current_setting('app.admin_email', true)
  );

-- Create policy to allow all users to view updates
CREATE POLICY "Users can view updates" ON updates 
  FOR SELECT USING (true);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_updates_created_at ON updates(created_at DESC);

-- Insert sample data (optional)
-- INSERT INTO updates (message, title) VALUES 
--   ('Welcome to our devotional journey! May Lord Ganesha bless us all.', 'Welcome Message'),
--   ('New festival games are now available. Test your knowledge and win rewards!', 'New Games Available');
