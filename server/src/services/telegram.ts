import axios from 'axios';
import OpenAI from 'openai';
import fs from 'fs';
import { TELEGRAM_BOT_TOKEN, OPENAI_API_KEY } from '../utils/env';
import { saveTaskToSupabase } from './supabase';

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// Send a reply message back to the Telegram user
async function sendTelegramMessage(chatId: number, text: string) {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    await axios.post(url, {
      chat_id: chatId,
      text,
    }, { timeout: 15000 });
    console.log('📤 Sent Telegram reply');
  } catch (err: any) {
    console.error('❌ Failed to send Telegram reply:', err?.message || err);
  }
}

interface TelegramUpdate {
  message?: {
    text?: string;
    voice?: {
      file_id: string;
      duration?: number;
      file_size?: number;
    };
    message_id: number;
    chat: {
      id: number;
    };
  };
}

// Download voice file from Telegram
async function downloadVoiceFile(fileId: string): Promise<Buffer> {
  try {
    // Step 1: Get file path from Telegram
    const fileUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`;
    console.log('📡 Requesting file info from Telegram API...');
    
    const { data } = await axios.get(fileUrl, { timeout: 30000 });

    if (!data?.ok) {
      console.error('❌ Telegram getFile API returned error:', JSON.stringify(data));
      throw new Error(`Telegram getFile API failed: ${JSON.stringify(data)}`);
    }

    if (!data?.result?.file_path) {
      console.error('❌ Telegram getFile response missing file_path:', JSON.stringify(data));
      throw new Error('Telegram getFile response missing file_path');
    }

    const filePath = data.result.file_path;
    const downloadUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${filePath}`;
    console.log('⬇️  Downloading from Telegram URL:', downloadUrl);
    console.log(`📦 File path: ${filePath}`);

    // Step 2: Download the actual file
    const response = await axios.get(downloadUrl, { 
      responseType: 'arraybuffer',
      timeout: 60000, // 60 second timeout for file download
      maxContentLength: 50 * 1024 * 1024, // Allow up to 50MB files
    });
    
    if (!response.data) {
      throw new Error('Downloaded file is empty');
    }

    const buffer = Buffer.from(response.data);
    console.log(`✅ Successfully downloaded ${buffer.length} bytes`);
    
    return buffer;
  } catch (err: any) {
    console.error('❌ Error downloading voice file:');
    console.error('  - Error message:', err.message);
    console.error('  - Error code:', err.code);
    
    if (err?.response) {
      console.error('  - HTTP Status:', err.response.status);
      console.error('  - HTTP Status Text:', err.response.statusText);
      console.error('  - Response Data:', JSON.stringify(err.response.data, null, 2));
    }
    
    // Provide helpful error messages
    if (err.message?.includes('timeout')) {
      throw new Error('Download timeout - voice file may be too large or network is slow');
    }
    
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      throw new Error('Cannot connect to Telegram servers - check internet connection');
    }
    
    throw err;
  }
}

// Transcribe voice using OpenAI Whisper (exported for use by app API)
export async function transcribeVoice(audioBuffer: Buffer): Promise<string> {
  console.log(`📊 Audio size: ${audioBuffer.length} bytes`);
  
  // Validate API key exists
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is missing from environment variables');
  }
  
  // Log API key status (first few chars only for security)
  if (OPENAI_API_KEY && !OPENAI_API_KEY.startsWith('sk-')) {
    console.warn('⚠️  WARNING: OPENAI_API_KEY does not start with "sk-" - may be invalid');
  } else {
    console.log(`🔑 Using OpenAI API key: ${OPENAI_API_KEY.substring(0, 7)}...${OPENAI_API_KEY.substring(OPENAI_API_KEY.length - 4)}`);
  }

  // Validate audio buffer has content
  if (!audioBuffer || audioBuffer.length === 0) {
    throw new Error('Audio buffer is empty');
  }

  const tempFilePath = `./temp_voice_${Date.now()}.ogg`;
  
  // Declare fileStream at function level so it's accessible in catch/finally blocks
  let fileStream: fs.ReadStream | null = null;
  
  try {
    // Save buffer to temporary file
    fs.writeFileSync(tempFilePath, audioBuffer);
    console.log(`💾 Saved audio to temp file: ${tempFilePath}`);
    
    // Verify file was written
    const stats = fs.statSync(tempFilePath);
    console.log(`📁 Temp file size: ${stats.size} bytes`);

    // Use Whisper-1 model (OpenAI's standard transcription model)
    // Note: OGG format from Telegram is supported by Whisper
    console.log('🤖 Starting transcription with whisper-1...');
    console.log(`🌐 OpenAI API base URL: ${openai.baseURL || 'https://api.openai.com/v1'}`);
    
    try {
      fileStream = fs.createReadStream(tempFilePath);
      
      // Handle stream errors
      fileStream.on('error', (streamError) => {
        console.error('🚨 File stream error:', streamError.message);
      });
      
      const transcription = await openai.audio.transcriptions.create(
        {
          file: fileStream,
          model: 'whisper-1',
          // remove forced language to allow auto-detection; improves non-English/short clips
          response_format: 'text'
        },
        { 
          timeout: 120000, // 120 seconds for longer voice notes
          maxRetries: 2    // Let OpenAI SDK retry internally
        }
      );

      let transcribedText = (transcription as any)?.text?.trim() || '';
      
      // Fallback: if empty text, request verbose_json and stitch segments
      if (!transcribedText) {
        console.log('⚠️  Empty text from whisper-1 (text). Retrying with verbose_json and auto language...');
        const vjson = await openai.audio.transcriptions.create(
          {
            file: fs.createReadStream(tempFilePath),
            model: 'whisper-1',
            response_format: 'verbose_json'
          },
          { timeout: 120000 }
        );
        const segments = (vjson as any)?.segments || [];
        if (Array.isArray(segments) && segments.length > 0) {
          transcribedText = segments.map((s: any) => s.text).join(' ').trim();
          console.log('🧵 Built text from segments:', transcribedText.substring(0, 80));
        }
      }

      if (!transcribedText) {
        throw new Error('Transcription returned empty text');
      }

      console.log(`✅ Transcription successful: "${transcribedText.substring(0, 50)}..."`);
      return transcribedText;
    } catch (apiError: any) {
      // Log detailed error before re-throwing
      console.error('🚨 OpenAI API call failed:');
      console.error('  - Message:', apiError.message);
      console.error('  - Cause:', apiError.cause?.message || apiError.cause);
      if (apiError.cause?.code) {
        console.error('  - Underlying error code:', apiError.cause.code);
      }
      throw apiError; // Re-throw to be caught by outer catch
    }
  } catch (error: any) {
    console.error('🚨 Transcription error details:');
    console.error('  - Error name:', error.name);
    console.error('  - Error message:', error.message);
    console.error('  - Error code:', error.code);
    console.error('  - Error type:', error.type);
    console.error('  - Error status:', error.status);
    
    // Log OpenAI-specific error details
    if (error?.response) {
      console.error('  - Response status:', error.response.status);
      console.error('  - Response status text:', error.response.statusText);
    }
    
    if (error?.response?.data) {
      console.error('  - Response data:', JSON.stringify(error.response.data, null, 2));
    }
    
    if (error?.error) {
      console.error('  - OpenAI error object:', JSON.stringify(error.error, null, 2));
    }
    
    // Retry with exponential backoff for connection errors
    const isConnectionError = 
      error.message?.includes('Connection error') ||
      error.message?.includes('ECONNRESET') || 
      error.message?.includes('ECONNREFUSED') ||
      error.message?.includes('ETIMEDOUT') ||
      error.message?.includes('ENOTFOUND') ||
      error.message?.includes('timeout') ||
      error.type === 'system' ||
      error.code === 'ECONNRESET' ||
      error.code === 'ECONNREFUSED' ||
      error.code === 'ETIMEDOUT';

    if (isConnectionError) {
      const maxRetries = 3;
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Exponential backoff: 1s, 2s, 4s (max 10s)
        console.log(`⚠️  Connection error detected (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        try {
          // Verify file still exists before retrying
          if (!fs.existsSync(tempFilePath)) {
            throw new Error('Temp file was deleted during retry');
          }
          
          // Close previous stream if it exists
          if (fileStream !== null && fileStream !== undefined) {
            try {
              (fileStream as fs.ReadStream).destroy();
            } catch (e) {
              // Ignore errors closing stream
            }
            fileStream = null;
          }
          
          // Re-create file stream for retry (fresh stream)
          const retryFileStream = fs.createReadStream(tempFilePath);
          retryFileStream.on('error', (streamError) => {
            console.error('🚨 Retry file stream error:', streamError.message);
          });
          
          const retryTranscription = await openai.audio.transcriptions.create(
            {
              file: retryFileStream,
              model: 'whisper-1',
              response_format: 'text'
            },
            { 
              timeout: 120000,
              maxRetries: 2
            }
          );
          
          let retryText = (retryTranscription as any)?.text?.trim() || '';
          if (!retryText) {
            // Retry fallback with verbose_json
            const retryVjson = await openai.audio.transcriptions.create(
              {
                file: fs.createReadStream(tempFilePath),
                model: 'whisper-1',
                response_format: 'verbose_json'
              },
              { timeout: 120000 }
            );
            const segments = (retryVjson as any)?.segments || [];
            if (Array.isArray(segments) && segments.length > 0) {
              retryText = segments.map((s: any) => s.text).join(' ').trim();
            }
          }
          if (retryText) {
            console.log(`✅ Retry transcription successful (attempt ${attempt}): "${retryText.substring(0, 50)}..."`);
            return retryText;
          }
          throw new Error('Retry transcription returned empty text');
        } catch (retryError: any) {
          if (attempt === maxRetries) {
            console.error(`❌ All ${maxRetries} retry attempts failed. Last error:`, retryError.message);
            throw retryError;
          }
          console.error(`⚠️  Retry attempt ${attempt} failed:`, retryError.message);
          // Continue to next retry attempt
        }
      }
    }
    
    throw error;
  } finally {
    // Clean up file stream
    if (fileStream !== null) {
      try {
        fileStream.destroy();
      } catch (e) {
        // Ignore errors closing stream
      }
    }
    
    // Clean up temp file
    if (fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
        console.log(`🗑️  Cleaned up temp file: ${tempFilePath}`);
      } catch (cleanupError) {
        console.error('⚠️  Failed to cleanup temp file:', cleanupError);
      }
    }
  }
}

// Process incoming Telegram update
export async function processTelegramUpdate(update: TelegramUpdate) {
  const message = update.message;
  
  if (!message) {
    return;
  }

  // Handle text message
  if (message.text) {
    const taskText = message.text.trim();
    if (taskText) {
      await saveTaskToSupabase({
        text: taskText,
        source: 'telegram',
        telegram_message_id: message.message_id.toString(),
      });
      console.log('✅ Saved text task:', taskText);
      // Reply to user to confirm
      await sendTelegramMessage(message.chat.id, `✅ Saved: ${taskText}`);
    }
  }

  // Handle voice message
  if (message.voice) {
    console.log('🎤 VOICE MESSAGE DETECTED!');
    console.log('Voice file_id:', message.voice.file_id);
    console.log('Voice duration (sec):', message.voice.duration);
    console.log('Voice file size (bytes):', message.voice.file_size);
    
    try {
      // Validate environment variables before starting
      if (!TELEGRAM_BOT_TOKEN) {
        throw new Error('TELEGRAM_BOT_TOKEN is missing - cannot download voice file');
      }
      
      if (!OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is missing - cannot transcribe voice');
      }
      
      // Download voice file
      console.log('⬇️  Downloading audio file from Telegram...');
      const audioBuffer = await downloadVoiceFile(message.voice.file_id);
      console.log(`✅ Downloaded ${audioBuffer.length} bytes`);
      
      // Validate downloaded buffer
      if (!audioBuffer || audioBuffer.length === 0) {
        throw new Error('Downloaded audio buffer is empty');
      }
      
      // Transcribe using OpenAI Whisper
      console.log('🤖 Transcribing with OpenAI Whisper...');
      const transcribedText = await transcribeVoice(audioBuffer);
      
      if (transcribedText && transcribedText.trim()) {
        await saveTaskToSupabase({
          text: transcribedText.trim(),
          source: 'telegram',
          telegram_message_id: message.message_id.toString(),
        });
        console.log(`✅ Saved voice task to Supabase: "${transcribedText.substring(0, 50)}..."`);
        // Reply back to Telegram user confirming save
        await sendTelegramMessage(message.chat.id, `✅ Saved: ${transcribedText.trim()}`);
      } else {
        console.log('⚠️  Empty transcription result, not saving');
        throw new Error('Transcription returned empty text');
      }
    } catch (error: any) {
      console.error('❌ ERROR PROCESSING VOICE MESSAGE!');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      
      if (error.stack) {
        console.error('Error stack:', error.stack);
      }
      
      // Log specific error details for debugging
      if (error.message?.includes('OPENAI_API_KEY')) {
        console.error('💡 Fix: Add OPENAI_API_KEY to your server/.env file');
      }
      
      if (error.message?.includes('TELEGRAM_BOT_TOKEN')) {
        console.error('💡 Fix: Add TELEGRAM_BOT_TOKEN to your server/.env file');
      }
      
      if (error?.response) {
        console.error('HTTP Response Status:', error.response.status);
        console.error('HTTP Response Data:', JSON.stringify(error.response.data, null, 2));
      }
      
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      // Save error details as task so user knows what went wrong
      const errorMessage = error.message || 'Unknown error';
      await saveTaskToSupabase({
        text: `[Voice note - transcription failed: ${errorMessage}]`,
        source: 'telegram',
        telegram_message_id: message.message_id.toString(),
      });
      console.log('⚠️  Saved error message as task for debugging');
      // Send friendly failure message to the user
      await sendTelegramMessage(message.chat.id, '⚠️ Could not transcribe your voice note. Please try again.');
    }
  }
}

