# Supabase Authentication Setup Guide

## 🚨 Current Issue
The authentication is failing because Supabase authentication settings need to be configured.

## 🔧 Step-by-Step Fix

### Step 1: Configure Authentication in Supabase

1. **Go to your Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project: `uzmadobjeqnxpfdfvymv`

2. **Navigate to Authentication Settings**
   - Go to: Authentication → Settings
   - Or click: Settings → Authentication

### Step 2: Configure Email Settings

1. **Enable Email Authentication**
   - Find "Enable email confirmations" 
   - **Turn this OFF** for testing (or keep ON if you want email verification)
   - This allows users to sign up without email confirmation

2. **Configure SMTP Settings (Optional)**
   - If you want email confirmations, set up SMTP
   - For now, we'll disable email confirmations

### Step 3: Set Up Site URL

1. **Go to Authentication → URL Configuration**
2. **Add your site URLs:**
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/**`
   - (Add your production URL later when deploying)

### Step 4: Configure Auth Providers

1. **Email Provider**
   - Make sure "Enable email signup" is ON
   - Make sure "Enable email confirmations" is OFF (for testing)

2. **Password Settings**
   - Minimum password length: 6 (or your preference)
   - Enable password strength requirements if desired

### Step 5: Test Authentication

After configuring, test the authentication:

1. **Restart your development server:**
   ```bash
   npm run dev
   ```

2. **Try to sign up with a test email**
3. **Check the browser console for any errors**

## 🗄️ Database Setup (If Not Done Yet)

Run this SQL in your Supabase SQL Editor:

```sql
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

-- Create policies
CREATE POLICY "Users can insert their own scores" ON game_scores
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view all scores" ON game_scores
  FOR SELECT USING (true);
```

## 🔍 Troubleshooting

### Common Issues:

1. **"Failed to fetch" error**
   - Check your Supabase URL and API key
   - Verify your project is active
   - Check network connectivity

2. **"Invalid email" error**
   - Make sure email format is valid
   - Check if email confirmations are disabled

3. **"Password too weak" error**
   - Increase minimum password length in settings
   - Or use a stronger password

4. **"Site URL not allowed" error**
   - Add `http://localhost:3000` to allowed URLs
   - Add your production URL when deploying

### Debug Steps:

1. **Check browser console** for detailed error messages
2. **Verify environment variables** are loaded correctly
3. **Test Supabase connection** in the dashboard
4. **Check authentication logs** in Supabase dashboard

## ✅ Verification Checklist

- [ ] Supabase project is active
- [ ] Environment variables are set correctly
- [ ] Authentication is enabled in Supabase
- [ ] Email confirmations are disabled (for testing)
- [ ] Site URL is configured
- [ ] Database tables are created
- [ ] RLS policies are set up

## 🚀 Next Steps

After fixing authentication:

1. **Test signup/login** with test accounts
2. **Play the game** and verify scores are saved
3. **Check leaderboard** functionality
4. **Deploy to Vercel** for production

## 📞 Need Help?

If you're still having issues:
1. Check the Supabase documentation
2. Look at the authentication logs in your dashboard
3. Verify your project settings
4. Test with a simple email/password combination 