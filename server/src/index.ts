import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import telegramRoutes from './routes/telegram';
import appRoutes from './routes/app';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/telegram', telegramRoutes);
app.use('/app', appRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Error handling to prevent server crashes
process.on('uncaughtException', (error: Error) => {
  console.error('💥 Uncaught Exception - Server will continue running:', error);
  console.error('Stack:', error.stack);
});

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('💥 Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
});

// Increase request timeout for voice note processing
app.use((req, res, next) => {
  req.setTimeout(300000); // 5 minutes for voice transcription
  res.setTimeout(300000);
  next();
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`⏱️  Request timeout: 300 seconds (for voice transcription)`);
});


