import 'dotenv/config';
import { IncomingMediaService } from './src/services/incoming-media-service';
import { DigitalOceanSpacesService } from './src/services/digitalocean-spaces';
import axios from 'axios';

async function compareTests() {
  console.log('🔍 Comparando testes direto vs IncomingMediaService...');

  const testMediaUrl = 'https://httpbin.org/image/jpeg';

  // Baixar o buffer uma vez
  console.log('1. Baixando buffer...');
  const response = await axios.get(testMediaUrl, { responseType: 'arraybuffer' });
  const buffer = Buffer.from(response.data);
  console.log(`✅ Buffer: ${buffer.length} bytes`);

  // Teste 1: Upload direto via DigitalOceanSpacesService
  console.log('\n2. Teste direto via DigitalOceanSpacesService...');
  const spacesService = new DigitalOceanSpacesService({
    accessKeyId: process.env.DO_SPACES_ACCESS_KEY!,
    secretAccessKey: process.env.DO_SPACES_SECRET_KEY!,
    region: process.env.DO_SPACES_REGION!,
    bucket: process.env.DO_SPACES_BUCKET!,
    endpoint: process.env.DO_SPACES_ENDPOINT!,
  });

  try {
    const result1 = await spacesService.uploadFile(
      buffer,
      `test/direct_${Date.now()}.jpg`,
      'image/jpeg',
      { acl: 'public-read' }
    );
    console.log('✅ Upload direto: SUCESSO');
  } catch (error) {
    console.log('❌ Upload direto: FALHA', error instanceof Error ? error.message : String(error));
  }

  // Teste 2: Via IncomingMediaService
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

compareTests();