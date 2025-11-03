// Quick test to verify OpenAI connection
import OpenAI from 'openai';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.error('❌ OPENAI_API_KEY not found in .env');
  process.exit(1);
}

console.log('🔑 API Key found:', apiKey.substring(0, 7) + '...' + apiKey.substring(apiKey.length - 4));
console.log('🧪 Testing OpenAI connection...\n');

const openai = new OpenAI({ apiKey });

// Create a tiny test audio file (or use an existing one)
const testMessage = 'Testing OpenAI Whisper connection';

// Check if we can at least create the client and ping the API
async function testConnection() {
  try {
    console.log('1️⃣ Testing API key validity...');
    
    // Try to list models (lightweight request)
    const models = await openai.models.list();
    console.log('✅ API key is valid - can access OpenAI API');
    console.log(`   Found ${models.data.length} available models\n`);
    
    // Check if whisper-1 is available
    const whisperModel = models.data.find(m => m.id === 'whisper-1');
    if (whisperModel) {
      console.log('✅ whisper-1 model is available\n');
    } else {
      console.log('⚠️  whisper-1 model not found in list\n');
    }
    
    console.log('✅ Connection test PASSED - OpenAI API is reachable');
    console.log('\n💡 If voice transcription still fails, it might be:');
    console.log('   - Network issue during file upload');
    console.log('   - File format issue');
    console.log('   - Rate limiting');
    
  } catch (error) {
    console.error('❌ Connection test FAILED');
    console.error('Error:', error.message);
    console.error('Error type:', error.constructor.name);
    
    if (error.cause) {
      console.error('Underlying error:', error.cause.message);
      console.error('Error code:', error.cause.code);
    }
    
    if (error.status) {
      console.error('HTTP Status:', error.status);
    }
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    
    console.error('\n💡 Possible fixes:');
    console.error('   1. Check your internet connection');
    console.error('   2. Check if firewall/proxy is blocking OpenAI API');
    console.error('   3. Verify API key is correct and has credits');
    console.error('   4. Check OpenAI status: https://status.openai.com/');
    
    process.exit(1);
  }
}

testConnection();


