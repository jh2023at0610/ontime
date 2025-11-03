# Backend Server Setup Guide

## Step 1: Get Your Service Role Key from Supabase

1. Go to: https://supabase.com/dashboard
2. Click on your project
3. Go to **Settings** → **API**
4. Find **service_role** key (NOT the anon key)
5. Copy it (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

## Step 2: Update server/.env File

Open `server/.env` and fill in:

```
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
TELEGRAM_WEBHOOK_SECRET=choose-any-random-string-here
OPENAI_API_KEY=your_openai_api_key
SUPABASE_URL=https://xnulxcngoynyzzadyhhp.supabase.co
SUPABASE_SERVICE_ROLE_KEY=paste_your_service_role_key_here
```

## Step 3: Test the Server

Run:
```bash
cd server
npm run dev
```

You should see: `🚀 Server running on port 3000`

## Step 4: Expose Your Server (for Telegram webhooks)

Since Telegram needs to send webhooks to your server, you need to expose it publicly.

### Option A: Use ngrok (Easiest - Free)

1. Download ngrok: https://ngrok.com/download
2. Extract and add to your PATH
3. Run: `ngrok http 3000`
4. Copy the `https://xxxxx.ngrok.io` URL

### Option B: Use localtunnel (Alternative)

1. Install: `npm install -g localtunnel`
2. Run: `lt --port 3000`
3. Copy the `https://xxxxx.loca.lt` URL

## Step 5: Set Up Telegram Webhook

Once you have your public URL, you need to:
1. Go to: https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook
2. Replace `<YOUR_BOT_TOKEN>` with your actual token
3. Add: `?url=https://your-ngrok-url.ngrok.io/telegram/webhook`
4. Add: `&secret_token=your-webhook-secret`
5. Press Enter in browser

Example:
```
https://api.telegram.org/bot123456:ABC-DEF/setWebhook?url=https://xxxxx.ngrok.io/telegram/webhook&secret_token=your-secret
```

## Step 6: Test It!

1. Open Telegram on your phone
2. Search for your bot
3. Send a message: "Buy groceries"
4. Check your Supabase Table Editor - the task should appear!
5. Check your mobile app - the task should sync automatically!

## Troubleshooting

- **Server not starting?** Check that all env variables are set correctly
- **Telegram not working?** Make sure the webhook URL is accessible and you used `secret_token` parameter
- **No tasks appearing?** Check the terminal logs for errors


