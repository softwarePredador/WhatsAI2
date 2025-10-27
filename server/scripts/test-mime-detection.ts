import { IncomingMediaService } from '../src/services/incoming-media-service';

async function testMimeTypeDetection() {
  console.log('🧪 Testing MIME type detection in IncomingMediaService...');

  const service = new IncomingMediaService();

  // Test different mime types
  const testCases = [
    { mimeType: 'image/jpeg', expectedExt: '.jpg' },
    { mimeType: 'image/png', expectedExt: '.png' },
    { mimeType: 'image/gif', expectedExt: '.gif' },
    { mimeType: 'video/mp4', expectedExt: '.mp4' },
    { mimeType: 'audio/mp3', expectedExt: '.mp3' },
    { mimeType: 'image/webp', expectedExt: '.webp' },
    { mimeType: 'unknown/type', expectedExt: '.bin' },
    { mimeType: undefined, expectedExt: '.bin' }
  ];

  for (const testCase of testCases) {
    // Access private method for testing
    const fileName = (service as any).generateFileName(
      'test-message-id',
      'image',
      'test-file',
      testCase.mimeType
    );

    const extension = fileName.split('.').pop();
    const expectedExt = testCase.expectedExt.replace('.', '');

    const status = extension === expectedExt ? '✅' : '❌';
    console.log(`${status} MIME: "${testCase.mimeType}" -> Extension: ".${extension}" (expected: "${expectedExt}")`);
  }

  console.log('✅ MIME type detection test completed');
}

testMimeTypeDetection();