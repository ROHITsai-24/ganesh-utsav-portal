# Idol Guessing Game - Setup Guide

## 🎯 Project Overview

This is a Next.js-based idol guessing game that supports multiple users, authentication, and score tracking. Users can guess celebrities/idols based on images and clues.

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **UI Components**: Shadcn/ui, Radix UI
- **Backend**: Supabase (Database + Authentication)
- **Deployment**: Vercel (Free tier)

## 📋 Prerequisites

- Node.js 18+ installed
- Git account
- Supabase account (free)
- Vercel account (free)

## 🚀 Setup Instructions

### 1. Supabase Database Setup

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to SQL Editor and run the following SQL to create the required tables:

```sql
-- Create game_scores table
CREATE TABLE game_scores (
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
```

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can find these values in your Supabase project settings under API.

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🎮 How to Play

1. **Sign Up/Login**: Users can create an account or login with email
2. **Guess the Idol**: Look at the image and try to guess the celebrity
3. **Use Clues**: Click "Show Clues" for hints about the idol
4. **Earn Points**: Correct guesses earn 10 points
5. **Leaderboard**: See how you rank against other players

## 📱 Features

- ✅ Multi-user authentication
- ✅ Real-time score tracking
- ✅ Leaderboard system
- ✅ Mobile-responsive design
- ✅ Free hosting on Vercel
- ✅ Free database on Supabase

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Connect your GitHub repo to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Manual Deployment

```bash
npm run build
npm start
```

## 🗄️ Database Schema

### Tables

1. **game_scores**
   - `id`: UUID (Primary Key)
   - `user_id`: UUID (Foreign Key to auth.users)
   - `score`: INTEGER
   - `idol_name`: TEXT
   - `user_guess`: TEXT
   - `created_at`: TIMESTAMP

## 🎨 Customization

### Adding More Idols

Edit the `sampleIdols` array in `src/components/game/GuessGame.jsx`:

```javascript
const sampleIdols = [
  {
    id: 4,
    name: 'New Celebrity',
    image: 'image_url_here',
    height: '5\'8"',
    clues: ['Clue 1', 'Clue 2', 'Clue 3']
  }
  // Add more idols...
]
```

### Styling

The project uses Tailwind CSS. You can customize colors and styling in:
- `src/app/globals.css`
- Component-specific classes

## 🔧 Troubleshooting

### Common Issues

1. **Supabase Connection Error**
   - Check environment variables
   - Verify Supabase project is active

2. **Authentication Issues**
   - Ensure Supabase Auth is enabled
   - Check email confirmation settings

3. **Database Errors**
   - Verify RLS policies are set correctly
   - Check table permissions

## 📞 Support

For issues or questions:
1. Check the Supabase documentation
2. Review Next.js documentation
3. Check Vercel deployment logs

## 🎯 Future Enhancements

- [ ] Add more game modes (height guessing, shape guessing)
- [ ] Implement user profiles
- [ ] Add image upload functionality
- [ ] Create admin panel for managing idols
- [ ] Add social features (friends, challenges)
- [ ] Implement achievements system

## 📄 License

This project is open source and available under the MIT License. 



database- Projectg_unprofessional_players