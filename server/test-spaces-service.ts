import 'dotenv/config';
import { DigitalOceanSpacesService } from './src/services/digitalocean-spaces';

async function testSpacesService() {
  console.log('🔍 Testando upload via DigitalOceanSpacesService...');

  const spacesService = new DigitalOceanSpacesService({
    accessKeyId: process.env.DO_SPACES_ACCESS_KEY!,
    secretAccessKey: process.env.DO_SPACES_SECRET_KEY!,
    region: process.env.DO_SPACES_REGION!,
    bucket: process.env.DO_SPACES_BUCKET!,
    endpoint: process.env.DO_SPACES_ENDPOINT!,
  });

  try {
    const testData = Buffer.from('Hello World from Spaces Service!');
    const fileKey = `incoming/image/${Date.now()}_test_image.txt`;

    const result = await spacesService.uploadFile(
      testData,
      fileKey,
      'text/plain',
      { acl: 'public-read' }
    );

    console.log('✅ Upload via Spaces Service bem-sucedido!');
    console.log('URL:', result.url);
    console.log('Key:', result.key);
  } catch (error) {
    console.log('❌ Erro no upload via Spaces Service:', error instanceof Error ? error.message : String(error));
    console.log('Stack:', error instanceof Error ? error.stack : 'No stack trace');
  }
}

testSpacesService();