import 'dotenv/config';
import { IncomingMediaService } from './src/services/incoming-media-service';

async function testIncomingMediaService() {
  console.log('🔍 Testando IncomingMediaService...');

  const service = new IncomingMediaService();

  try {
    // Testar com uma URL de imagem simples
    const result = await service.processIncomingMedia({
      messageId: 'test_message_' + Date.now(),
      mediaUrl: 'https://httpbin.org/image/jpeg',
      mediaType: 'image',
      fileName: 'test_image.jpg',
      mimeType: 'image/jpeg'
    });

    console.log('✅ Processamento bem-sucedido!');
    console.log('Resultado:', result);
  } catch (error) {
    console.log('❌ Erro no processamento:', error instanceof Error ? error.message : String(error));
  }
}

testIncomingMediaService();