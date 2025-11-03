# 📡 Setting Up Telegram Webhook

## Step 1: Download ngrok

1. Go to: https://ngrok.com/download
2. Download the Windows version
3. Extract the ZIP file
4. Copy `ngrok.exe` to a folder (like `C:\ngrok\`)
5. Or add to your PATH so you can run it from anywhere

## Step 2: Expose Your Local Server

Open a **NEW** terminal (keep your server running in the background) and run:

```bash
ngrok http 3000
```

You'll see something like:
```
ngrok

Session Status                online
Forwarding                   https://abc123.ngrok.io -> http://localhost:3000
```

**Copy the `https://abc123.ngrok.io` URL** - you'll need it in the next step.

## Step 3: Set Telegram Webhook

Now you need to tell Telegram where to send messages.

**Keep this URL format, replace these values:**

```
https://api.telegram.org/bot8123150064:AAH4LeF5AQ162pFhgB49OF_Q2nuvdIYiFP4/setWebhook?url=https://YOUR_NGROK_URL/telegram/webhook&secret_token=AylaLeyla
```

**Replace `YOUR_NGROK_URL`** with the URL you got from ngrok (like `abc123.ngrok.io`)

## Example (Copy and paste this in your browser after ngrok is running):

```
https://api.telegram.org/bot8123150064:AAH4LeF5AQ162pFhgB49OF_Q2nuvdIYiFP4/setWebhook?url=https://abc123.ngrok.io/telegram/webhook&secret_token=AylaLeyla
```

After pressing Enter, you should see:
```json
{"ok":true,"result":true,"description":"Webhook was set"}
```

## Step 4: Test It!

1. Open Telegram on your phone
2. Search for your bot
3. Send a message: "Buy groceries"
4. Wait 2-3 seconds
5. Task should appear in your mobile app! 🎉

## Troubleshooting

**"Webhook is not set"**
- Make sure ngrok is running (`ngrok http 3000`)
- Make sure your server is running (`npm run dev` in server folder)
- Check that the URL doesn't have extra spaces

**"Webhook failed"**
- Make sure you're using the correct bot token
- Check that the secret_token matches what's in your `.env` file
- Look at your server terminal for any error messages

**Task not appearing**
- Check the server terminal for any Supabase errors
- Pull down in your mobile app to refresh
- Check Supabase Table Editor to see if the task was saved


