import * as Sentry from '@sentry/node';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Test Sentry Integration
 * 
 * Run this script to test if Sentry is working:
 * npx tsx src/test-sentry.ts
 */
async function testSentry() {
  console.log('🧪 Testing Sentry integration...\n');

  // Test 1: Simple log
  console.log('1️⃣ Testing info log...');
  Sentry.captureMessage('Test message from WhatsAI', 'info');
  console.log('✅ Info log sent\n');

  // Test 2: Warning
  console.log('2️⃣ Testing warning...');
  Sentry.captureMessage('This is a test warning', 'warning');
  console.log('✅ Warning sent\n');

  // Test 3: Error with context
  console.log('3️⃣ Testing error with context...');
  try {
    // Intentional error for testing
    throw new Error('This is a test error - ignore it!');
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        test: 'true',
        feature: 'sentry-test'
      },
      extra: {
        timestamp: new Date().toISOString(),
        environment: process.env['NODE_ENV'] || 'development'
      }
    });
    console.log('✅ Error captured with context\n');
  }

  // Test 4: Span for performance monitoring
  console.log('4️⃣ Testing performance span...');
  await Sentry.startSpan({
    op: 'test',
    name: 'Test Database Query',
  }, async () => {
    // Simulate a database query
    await prisma.whatsAppInstance.count();
    console.log('✅ Performance span recorded\n');
  });

  // Flush to make sure everything is sent
  console.log('⏳ Flushing events to Sentry...');
  await Sentry.flush(2000);
  console.log('✅ All events sent!\n');

  console.log('🎉 Sentry test complete!');
  console.log('📊 Check your Sentry dashboard: https://sentry.io/organizations/whatsai/issues/');
  
  await prisma.$disconnect();
  process.exit(0);
}

testSentry().catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
