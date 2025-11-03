# To‑Do App + Telegram Bot – Deploy Guide

This project has two parts:
- `app/` – Expo React Native client that reads/writes tasks to Supabase
- `server/` – Express server for Telegram bot (text + voice → OpenAI Whisper) that saves tasks to Supabase

## 1) Prerequisites
- Supabase project created with a `tasks` table (see `create_table.sql`)
- Telegram bot token from @BotFather
- OpenAI API key (for Whisper voice transcription)

## 2) Environment Variables
Fill these using the provided examples:

- App (Expo): copy `app/env.example` → `app/.env`
```
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

- Server (Express): copy `server/env.example` → `server/.env`
```
TELEGRAM_BOT_TOKEN=...
TELEGRAM_WEBHOOK_SECRET=some-random-string
OPENAI_API_KEY=...
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
PORT=3000
NODE_ENV=production
```
Notes:
- `EXPO_PUBLIC_*` are safe for the client. Do NOT put secrets in the Expo app.
- The server uses the Supabase service role key to insert tasks from the bot. Keep it secret.

## 3) Deploy the Server (Render.com – recommended)
Render supports long requests and is simple to set up.

1. Push this repo to GitHub.
2. In Render, create a new Web Service, choose the `server/` directory.
3. Environment: Node 18+.
4. Build Command:
```
npm ci && npm run build
```
5. Start Command:
```
npm run start
```
6. Add environment variables from `server/.env`.
7. Deploy and note your public URL, e.g. `https://your-app.onrender.com`.
8. Verify health: open `https://your-app.onrender.com/health`.

If you deploy elsewhere (Railway/Fly), use the same build/start commands. Avoid Vercel serverless for voice transcription due to short timeouts.

## 4) Set Telegram Webhook
After the server is live, set the webhook so Telegram forwards updates to your API.
- Public endpoint to use:
```
https://YOUR_SERVER/telegram/webhook?secret=YOUR_TELEGRAM_WEBHOOK_SECRET
```
- Use the steps in `SETUP_TELEGRAM_WEBHOOK.md` or run this from any terminal (replace values):
```
curl -X POST "https://api.telegram.org/botYOUR_TELEGRAM_BOT_TOKEN/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://YOUR_SERVER/telegram/webhook?secret=YOUR_TELEGRAM_WEBHOOK_SECRET",
    "allowed_updates": ["message"]
  }'
```
- Send a test message/voice note to your bot and check server logs.

## 5) Publish the App (Expo)
Quick share via Expo Go or build for stores.

- Install dependencies:
```
cd app
npm install
```
- Ensure `app/.env` is set (Supabase URL + anon key).
- Start locally (for testing):
```
npm run start
```

### Option A: Expo Go (fastest)
- Run `npm run start`, scan the QR with Expo Go.
- Share the project using an Expo account.

### Option B: EAS Build (App Store/Play Store)
1. Install EAS CLI globally:
```
npm i -g eas-cli
```
2. Log in:
```
eas login
```
3. Configure and build:
```
eas build --platform android
# and/or
.eas build --platform ios
```
4. Follow the interactive steps to upload to stores.

## 6) Supabase Schema
Ensure the `tasks` table exists and has the columns used in code. See `create_table.sql` and `SUPABASE_SETUP.md` for details.

## 7) Useful Commands
- Server (local):
```
cd server
npm install
npm run dev    # hot-reload dev
npm run build  # compile TS → dist
npm run start  # run dist
```
- App (local):
```
cd app
npm install
npm run start
```

## 8) Troubleshooting
- Server 404/timeout: verify `https://YOUR_SERVER/health`.
- Webhook not firing: re-run `setWebhook` with correct URL + `secret`.
- OpenAI issues: check `OPENAI_API_KEY` and server logs.
- No tasks in app: confirm `EXPO_PUBLIC_SUPABASE_*` and Supabase RLS policies.

## Component/Route Notes
- Server `src/index.ts`: Express app, routes at `/telegram` and `/health`.
- Server `src/routes/telegram.ts`: webhook handler.
- App `src/screens/TasksScreen.tsx`: main tasks list UI.
- App `src/services/supabase.ts`: Supabase client + CRUD.

Happy shipping! 🚀

