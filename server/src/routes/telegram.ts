import express from 'express';
import { processTelegramUpdate } from '../services/telegram';
import { TELEGRAM_WEBHOOK_SECRET } from '../utils/env';

const router = express.Router();

// Middleware to verify webhook secret
function verifyWebhookSecret(req: express.Request, res: express.Response, next: express.NextFunction) {
  const secret = req.headers['x-telegram-bot-api-secret-token'];
  
  // Allow requests without secret for development
  if (!TELEGRAM_WEBHOOK_SECRET) {
    return next();
  }
  
  // Verify secret matches
  if (secret !== TELEGRAM_WEBHOOK_SECRET) {
    console.log('⚠️  Webhook secret mismatch');
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  next();
}

// Webhook endpoint
router.post('/webhook', verifyWebhookSecret, async (req, res) => {
  const update = req.body;
  
  console.log('📨 Received Telegram update:', update.message?.voice ? 'voice' : (update.message?.text ? 'text' : 'other'));
  
  // Respond immediately to Telegram (within 3 seconds to avoid timeout)
  // Process the update asynchronously after responding
  res.status(200).json({ ok: true });
  
  // Process the update asynchronously (don't await - let it run in background)
  // This prevents timeouts for long operations like voice transcription
  processTelegramUpdate(update).catch((error: any) => {
    console.error('❌ Error processing Telegram update (async):', error);
    console.error('Error stack:', error.stack);
  });
});

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ message: 'Telegram webhook is active!' });
});

export default router;


