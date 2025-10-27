import 'dotenv/config';
import { IncomingMediaService } from './src/services/incoming-media-service';

async function testIncomingMediaProcessing() {
  console.log('🔍 Comparando testes direto vs IncomingMediaService...');

  const testMediaUrl = 'https://httpbin.org/image/jpeg';

  // Teste: Via IncomingMediaService
  console.log('\n3. Teste via IncomingMediaService...');
  const incomingService = new IncomingMediaService();

  try {
    const result2 = await incomingService.processIncomingMedia({
      messageId: 'compare_test_' + Date.now(),
      mediaUrl: testMediaUrl,
      mediaType: 'image',
      fileName: 'compare.jpg',
      mimeType: 'image/jpeg'
    });

    console.log('✅ IncomingMediaService: SUCESSO');
  } catch (error) {
    console.log('❌ IncomingMediaService: FALHA', error instanceof Error ? error.message : String(error));
  }
}

testIncomingMediaProcessing();