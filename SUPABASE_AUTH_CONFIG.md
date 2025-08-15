# Supabase Authentication Configuration Guide

## 🎯 **Your Supabase Authentication Sections:**

Based on your interface, here's exactly what to configure:

### **1. Emails Section**
- **Go to:** Authentication → Emails
- **Find:** "Enable email confirmations"
- **Action:** Turn this **OFF** (for testing)
- **Why:** This allows users to sign up without email verification

### **2. Sign In / Providers Section**
- **Go to:** Authentication → Sign In / Providers
- **Find:** "Email" provider
- **Actions:**
  - ✅ Make sure "Enable email signup" is **ON**
  - ✅ Make sure "Enable email confirmations" is **OFF**
  - ✅ Set minimum password length to **6** (or your preference)

### **3. URL Configuration Section**
- **Go to:** Authentication → URL Configuration
- **Add these URLs:**
  - **Site URL:** `http://localhost:3000`
  - **Redirect URLs:** `http://localhost:3000/**`
  - **Additional Redirect URLs:** `http://localhost:3000`

### **4. Policies Section (Optional)**
- **Go to:** Authentication → Policies
- **Verify:** Default authentication policies are enabled

## 🗄️ **Database Setup (Required)**

You also need to create the database tables:

1. **Go to:** SQL Editor in your Supabase dashboard
2. **Run this SQL:**

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

## ✅ **Verification Steps**

After configuring:

1. **Test signup:**
   - Go to your app: http://localhost:3000
   - Try to sign up with a test email
   - Should work without email confirmation

2. **Test login:**
   - Try logging in with the same credentials
   - Should work immediately

3. **Check for errors:**
   - Open browser console (F12)
   - Look for any authentication errors

## 🔍 **If You Still See Issues**

### **Common Problems:**

1. **"Site URL not allowed"**
   - Make sure you added `http://localhost:3000` to URL Configuration

2. **"Email confirmation required"**
   - Make sure email confirmations are turned OFF in Emails section

3. **"Invalid email format"**
   - Use a valid email format (e.g., test@example.com)

4. **"Password too weak"**
   - Increase minimum password length in Sign In / Providers

## 🚀 **Next Steps**

After successful configuration:

1. **Test the authentication** with a test account
2. **Play the game** and verify scores are saved
3. **Check the leaderboard** functionality
4. **Deploy to Vercel** when ready

## 📞 **Need Help?**

If you're still having issues:
1. Check the browser console for specific error messages
2. Verify all settings are saved in Supabase
3. Try with a simple test email (test@test.com)
4. Make sure your Supabase project is active 