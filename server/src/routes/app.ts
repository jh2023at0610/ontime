import express from 'express';
import multer from 'multer';
import { transcribeVoice } from '../services/telegram';
import { saveTaskToSupabase } from '../services/supabase';

const router = express.Router();

// Configure multer for handling file uploads in memory
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Voice transcription endpoint for mobile app
router.post('/transcribe', upload.single('audio'), async (req, res) => {
  try {
    console.log('🎤 Received audio from mobile app');
    
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    console.log(`📦 Audio file size: ${req.file.size} bytes`);
    console.log(`📦 Audio mimetype: ${req.file.mimetype}`);

    // Transcribe the audio using OpenAI Whisper
    const transcribedText = await transcribeVoice(req.file.buffer);
    
    console.log(`✅ Transcription successful: "${transcribedText.substring(0, 50)}..."`);

    // Optionally save as task immediately (or let client decide)
    const saveToSupabase = req.body.saveTask === 'true' || req.body.saveTask === true;
    
    if (saveToSupabase) {
      await saveTaskToSupabase({
        text: transcribedText,
        source: 'app',
      });
      console.log('💾 Task saved to Supabase');
    }

    res.json({ 
      success: true, 
      transcription: transcribedText,
      saved: saveToSupabase
    });

  } catch (error: any) {
    console.error('❌ Error transcribing audio from app:', error);
    res.status(500).json({ 
      error: 'Transcription failed', 
      message: error.message 
    });
  }
});

// Health check for app API
router.get('/health', (req, res) => {
  res.json({ status: 'App API is healthy' });
});

export default router;

