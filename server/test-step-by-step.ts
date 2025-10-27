import 'dotenv/config';
import { IncomingMediaService } from './src/services/incoming-media-service';
import axios from 'axios';

async function testStepByStep() {
  console.log('🔍 Teste passo a passo do IncomingMediaService...');

  const service = new IncomingMediaService();

  try {
    const testMediaUrl = 'https://httpbin.org/image/jpeg';
    const messageId = 'test_message_' + Date.now();

    console.log('1. Baixando mídia...');
    const response = await axios.get(testMediaUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data);
    console.log(`✅ Buffer baixado: ${buffer.length} bytes`);

    console.log('2. Testando upload direto...');
    const fileName = 'test_image.jpg';
    const mediaType = 'image';

    // Chamar o método uploadToSpaces diretamente
    const uploadResult = await (service as any).uploadToSpaces(buffer, fileName, mediaType, 'Teste');

    console.log('✅ Upload bem-sucedido!');
    console.log('Resultado:', uploadResult);

  } catch (error) {
    console.log('❌ Erro:', error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.log('Stack:', error.stack);
    }
  }
}

testStepByStep();