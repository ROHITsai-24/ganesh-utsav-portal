-- Database Setup for Idol Guessing Game
-- Run this in your Supabase SQL Editor

-- Create game_scores table
CREATE TABLE IF NOT EXISTS game_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  idol_name TEXT NOT NULL,
  user_guess TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE game_scores ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to insert their own scores
CREATE POLICY "Users can insert their own scores" ON game_scores
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to view all scores
CREATE POLICY "Users can view all scores" ON game_scores
  FOR SELECT USING (true);

-- Create policy to allow users to update their own scores
CREATE POLICY "Users can update their own scores" ON game_scores
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policy to allow users to delete their own scores
CREATE POLICY "Users can delete their own scores" ON game_scores
  FOR DELETE USING (auth.uid() = user_id);

-- Verify the table was created
SELECT * FROM game_scores LIMIT 1; 