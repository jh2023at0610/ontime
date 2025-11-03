# 🚀 Quick Start: Connect Telegram to Your App

## Current Status

✅ Server is running at http://localhost:3000  
✅ Mobile app is running and connected to Supabase  
❌ Need to expose server publicly for Telegram

## Step-by-Step Instructions

### Step 1: Download ngrok

1. **Go to**: https://ngrok.com/download
2. **Download** the Windows version (ngrok-windows-amd64.zip)
3. **Extract** the ZIP file somewhere (like `C:\ngrok\`)
4. **Copy** `ngrok.exe` from the extracted folder

### Step 2: Run ngrok

Open a **NEW** terminal window (keep your server running) and run:

```bash
# If you put ngrok in C:\ngrok\, run:
C:\ngrok\ngrok.exe http 3000

# OR if you added it to PATH:
ngrok http 3000
```

You'll see:
```
Forwarding   https://abc123.ngrok.io -> http://localhost:3000
```

**Copy the `https://abc123.ngrok.io` part** (this will be different for you)

### Step 3: Register Webhook with Telegram

**Replace `YOUR_NGROK_URL` with the URL from Step 2** and paste this in your browser:

```
https://api.telegram.org/bot8123150064:AAH4LeF5AQ162pFhgB49OF_Q2nuvdIYiFP4/setWebhook?url=https://YOUR_NGROK_URL/telegram/webhook&secret_token=AylaLeyla
```

Example (yours will be different):
```
https://api.telegram.org/bot8123150064:AAH4LeF5AQ162pFhgB49OF_Q2nuvdIYiFP4/setWebhook?url=https://abc123.ngrok.io/telegram/webhook&secret_token=AylaLeyla
```

Press Enter. You should see:
```json
{"ok":true,"result":true,"description":"Webhook was set"}
```

### Step 4: Test It! 🎉

1. Open Telegram on your phone
2. Find your bot (search by username)
3. Send: **"Buy groceries"**
4. Wait 2-3 seconds
5. **Check your mobile app** - the task should appear!

## What's Running

You should have **3 terminal windows open**:

1. **Mobile app** - `npx expo start --tunnel` (in `app/` folder)
2. **Backend server** - `npm run dev` (in `server/` folder)  
3. **ngrok** - `ngrok http 3000` (new terminal)

## Testing Voice Notes

1. Open Telegram
2. Find your bot
3. **Hold the microphone** button and speak: "Call the dentist"
4. Send the voice message
5. The server will transcribe it with OpenAI Whisper
6. Task appears in your app as text!

## Troubleshooting

**"Webhook was not set"**
- Make sure ngrok is running
- Check the URL format (no extra spaces)
- Look at server terminal for errors

**"Task not appearing in app"**
- Pull down in the app to refresh
- Check server terminal logs
- Look at Supabase Table Editor to verify data

**"ngrok command not found"**
- Download ngrok from https://ngrok.com/download
- Extract and run the .exe file
- Or copy to a folder and use full path

## Next Steps

Once everything is working:
- Test with multiple tasks
- Try voice notes
- Toggle tasks on/off in the app
- Delete tasks from the app

Enjoy your complete Telegram To-Do app! 🚀

