# Supabase Setup Guide

## Step 1: Create the Tasks Table

1. Go to your Supabase project: https://supabase.com/dashboard
2. Click on your project
3. Go to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy and paste the entire contents of `create_table.sql` into the editor
6. Click **Run** (or press Ctrl+Enter)

You should see: "Success. No rows returned"

## Step 2: Verify the Table

1. Go to **Table Editor** (left sidebar)
2. You should see a `tasks` table
3. Click on it to see the columns:
   - `id` (uuid)
   - `text` (text)
   - `completed` (boolean)
   - `source` (text)
   - `created_at` (timestamp)
   - `telegram_message_id` (text)
   - `updated_at` (timestamp)

## Step 3: Test the Table

You can add a test task:
1. In Table Editor, click **Insert** → **Insert row**
2. Fill in:
   - `text`: "Test task from Supabase"
   - `completed`: false
   - `source`: "telegram"
3. Click **Save**

This test task should now appear in your mobile app!

## What We Just Did

- Created the `tasks` table with all necessary columns
- Enabled Row Level Security (RLS) with a public policy
- Created an index for faster queries
- Enabled real-time updates

Your app is now ready to connect to Supabase! 🎉


