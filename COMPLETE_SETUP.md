# 🚀 Complete Telegram Todo App - Setup Guide

## What We Built

✅ **Mobile App** (React Native with Expo)
- Beautiful task list UI
- Connect to Supabase database
- View, toggle, and delete tasks
- Real-time syncing

✅ **Backend Server** (Node.js + Express)
- Receives Telegram messages
- Transcribes voice notes with OpenAI Whisper
- Saves tasks to Supabase

✅ **Database** (Supabase)
- PostgreSQL database
- Tasks table with all necessary fields

## Current Status

### ✅ Completed
1. Mobile app created and running
2. Supabase table created
3. App successfully connects to database
4. Shows "No tasks yet" when empty

### 🔧 Remaining Steps

#### 1. Configure Server Environment
Edit `server/.env`:

```
TELEGRAM_BOT_TOKEN=your_token_from_botfather
TELEGRAM_WEBHOOK_SECRET=choose-a-random-string
OPENAI_API_KEY=your_openai_key
SUPABASE_URL=https://xnulxcngoynyzzadyhhp.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**To get Service Role Key:**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Settings → API
4. Copy `service_role` key (NOT anon key)

#### 2. Start the Server
```bash
cd server
npm run dev
```

#### 3. Expose Server Publicly (for Telegram webhooks)

**Option A: ngrok (Recommended)**
```bash
# Download from https://ngrok.com/download
# Then run:
ngrok http 3000
# Copy the https://xxxxx.ngrok.io URL
```

**Option B: localtunnel**
```bash
npm install -g localtunnel
lt --port 3000
# Copy the https://xxxxx.loca.lt URL
```

#### 4. Set Up Telegram Webhook

Replace these values in the URL below:
- `<YOUR_BOT_TOKEN>` → Your Telegram bot token
- `<ngrok_url>` → Your ngrok URL
- `<your_secret>` → Same secret from `.env`

```
https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://<ngrok_url>/telegram/webhook&secret_token=<your_secret>
```

Paste this in your browser and press Enter.

## Testing the Complete Flow

1. ✅ Mobile app is running (shows tasks)
2. ✅ Server is running (`npm run dev` in `server/` folder)
3. ✅ ngrok/localtunnel is running (exposing port 3000)
4. ✅ Webhook is registered with Telegram

**Now test:**
1. Open Telegram
2. Find your bot
3. Send: "Buy milk"
4. Wait 2-3 seconds
5. Task should appear in your mobile app!

## How It Works

```
You → Telegram Bot → Server → Supabase → Mobile App
```

1. You send a task to Telegram bot
2. Telegram sends webhook to your server
3. Server saves to Supabase database
4. Mobile app fetches from Supabase (auto-refreshes)
5. Task appears in your app!

## Voice Notes

Send a voice message to the bot:
1. Open Telegram
2. Record your voice: "Call the dentist tomorrow"
3. Server downloads the audio
4. OpenAI Whisper transcribes it
5. Saves to Supabase
6. Appears in mobile app as text!

## Project Structure

```
to do list app/
├── app/                    # Mobile app (React Native)
│   ├── src/
│   │   ├── screens/        # App screens
│   │   └── services/       # Supabase client
│   └── .env                # Supabase credentials
├── server/                 # Backend server
│   ├── src/
│   │   ├── routes/         # API endpoints
│   │   └── services/       # Telegram + Supabase logic
│   └── .env                # All API keys
└── create_table.sql        # Database setup
```

## Next Steps

1. Fill in `server/.env` with credentials
2. Start server: `cd server && npm run dev`
3. Expose with ngrok: `ngrok http 3000`
4. Register webhook with Telegram
5. Test by sending a message to your bot!

## Troubleshooting

**"Error fetching tasks" in mobile app**
- Check that Supabase table exists
- Verify `.env` has correct credentials

**Server won't start**
- Check all variables in `server/.env` are filled
- Check ports 3000 is available

**Telegram webhook not working**
- Make sure ngrok is running
- Check webhook URL format
- Look at server logs for errors

**Tasks not appearing in app**
- Pull down in app to refresh
- Check server logs for Supabase errors
- Verify Supabase table has data

## You're Ready! 🎉

Follow these steps to complete the integration and start capturing tasks from Telegram!


