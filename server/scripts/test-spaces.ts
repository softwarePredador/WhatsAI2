import { DigitalOceanSpacesService } from '../src/services/digitalocean-spaces';

async function testSpacesConnection() {
  console.log('🧪 Testing DigitalOcean Spaces connection...');

  const spacesService = new DigitalOceanSpacesService({
    accessKeyId: 'DO002UXFZ74XBDVPVJJC',
    secretAccessKey: 'GnqIjCjypNgL9ozPKe/TNwGBPtFkPTt0qq1EzJ/ttcM',
    bucket: 'whatsais3',
    region: 'sfo3',
    endpoint: 'https://sfo3.digitaloceanspaces.com'
  });

  try {
    // Test uploading a small test file
    console.log('� Testing file upload...');
    const testContent = Buffer.from('Hello from WhatsAI test!');
    const testKey = `test-${Date.now()}.txt`;

    const result = await spacesService.uploadFile(
      testContent,
      testKey,
      'text/plain',
      {
        onProgress: (progress) => {
          console.log(`📊 Upload progress: ${progress.percentage}%`);
        }
      }
    );

    console.log('✅ File uploaded successfully!');
    console.log(`📍 URL: ${result.url}`);
    console.log(`🔗 CDN URL: ${spacesService.getCdnUrl(testKey)}`);

    // Clean up test file
    console.log('🧹 Cleaning up test file...');
    await spacesService.deleteFile(testKey);
    console.log('✅ Test file deleted');

  } catch (error) {
    console.error('❌ Error testing Spaces connection:', error);
    process.exit(1);
  }
}

testSpacesConnection();