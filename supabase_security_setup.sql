-- Supabase Security Setup (Row Level Security)
-- Run this in your Supabase SQL Editor to secure your data.

-- Note: Since you currently use local storage (Zustand) and don't have remote tables yet,
-- this script serves as the blueprint for your future remote tables (e.g., 'profiles', 'workouts').

-- Example: Creating a profiles table securely
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  updated_at TIMESTAMP WITH TIME ZONE,
  username TEXT UNIQUE,
  avatar_url TEXT
);

-- 1. Enable RLS on the table (CRITICAL)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Create Policy: Users can only READ their own profile
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING ( auth.uid() = id );

-- 3. Create Policy: Users can only UPDATE their own profile
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING ( auth.uid() = id );

-- 4. Create Policy: Users can only INSERT their own profile
CREATE POLICY "Users can insert own profile" 
ON public.profiles FOR INSERT 
WITH CHECK ( auth.uid() = id );

-- To apply this to ANY future table, replace 'profiles' with your table name, 
-- and ensure the table has a 'user_id' column that links to auth.users.
