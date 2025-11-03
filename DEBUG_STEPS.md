# Debug Steps

## Step 1: Verify Tasks Are in Supabase

1. Go to: https://supabase.com/dashboard
2. Select your project
3. Go to **Table Editor**
4. Click on the **tasks** table
5. **Do you see the tasks there?** (Buy groceries, buy milk, etc.)

If YES → Tasks are in database, app isn't displaying them
If NO → Server isn't saving to database properly

## Step 2: Check Mobile App Console

If running on phone:
1. Check the terminal where Expo is running
2. Look for console.log messages
3. Share what you see

If running in browser:
1. Press F12 to open DevTools
2. Click Console tab
3. Pull down to refresh the app
4. Look for messages like "🔍 Fetching tasks" or "Error fetching tasks"
5. Share what you see

## Step 3: Test Direct Query

Try accessing your Supabase table directly via browser:

Replace YOUR_SUPABASE_URL and YOUR_ANON_KEY with actual values from your .env file:

```
https://YOUR_SUPABASE_URL/rest/v1/tasks?select=*&apikey=YOUR_ANON_KEY
```

This will show you the raw data from your database.

## What to Share

Please tell me:
1. Do tasks appear in Supabase Table Editor?
2. What do you see in the console?
3. Any error messages?


