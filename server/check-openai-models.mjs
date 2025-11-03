import OpenAI from 'openai';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env from server directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

// Simple diagnostics: verifies API key is present and lists audio/transcription models
async function main() {
  const apiKey = process.env.OPENAI_API_KEY || '';
  if (!apiKey) {
    console.error('OPENAI_API_KEY is missing. Set it in server/.env');
    console.error('Current .env file location:', join(__dirname, '.env'));
    console.error('Environment variables loaded:', Object.keys(process.env).filter(k => k.includes('OPENAI')).join(', '));
    process.exit(1);
  }

  const client = new OpenAI({ apiKey });
  try {
    const models = await client.models.list();
    const ids = models.data.map(m => m.id);
    const interesting = ids.filter(id => /whisper|transcribe|audio/i.test(id)).sort();
    console.log('Found models related to audio/transcribe:');
    interesting.forEach(id => console.log(' -', id));
  } catch (err) {
    console.error('Failed to list models:', err?.message || err);
    if (err?.response?.data) {
      console.error('OpenAI response data:', JSON.stringify(err.response.data));
    }
    process.exit(2);
  }
}

main();


