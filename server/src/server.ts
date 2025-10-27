// IMPORTANT: Import Sentry instrumentation FIRST, before anything else
import './instrument';

// Load environment variables
import 'dotenv/config';

import { App } from './core/app';
import { env } from './config/env';

async function bootstrap() {
  try {
    console.log('🚀 Starting WhatsAI Multi-Instance Manager...');
    
    const app = new App();
    await app.start();
    
    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('SIGTERM received, shutting down gracefully...');
      await app.stop();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      console.log('SIGINT received, shutting down gracefully...');
      await app.stop();
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();