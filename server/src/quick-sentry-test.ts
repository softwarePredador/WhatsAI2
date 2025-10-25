// Simple Sentry verification test
import './instrument';
import * as Sentry from '@sentry/node';

async function quickTest() {
  console.log('🧪 Quick Sentry test...\n');

  try {
    throw new Error('Quick test error - Sentry is working!');
  } catch (e) {
    Sentry.captureException(e);
    console.log('✅ Error captured and sent to Sentry');
  }

  await Sentry.flush(2000);
  console.log('✅ Event flushed to Sentry');
  console.log('\n📊 Check dashboard: https://sentry.io/organizations/whatsai/issues/\n');
  process.exit(0);
}

quickTest();
