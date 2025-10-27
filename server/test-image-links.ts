import axios from 'axios';

async function testImageUrls() {
  console.log('🧪 Testando URLs de imagens processadas...\n');

  // URLs das imagens que foram processadas para DigitalOcean Spaces
  const imageUrls = [
    'https://whatsais3.sfo3.cdn.digitaloceanspaces.com/incoming/image/1761488825876_kl4xkkqcx_image_cmh7qycan000cuew0moshdvd8_jw3zu5f7k_1761488825876.bin',
    'https://whatsais3.sfo3.cdn.digitaloceanspaces.com/incoming/image/1761488827641_wuanndwwb_image_cmh7qyd2l000euew0fl4n4hjr_8ubjiw5fw_1761488827641.bin'
  ];

  for (const url of imageUrls) {
    try {
      console.log(`🔗 Testando: ${url.substring(0, 80)}...`);

      const response = await axios.head(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      console.log(`✅ Status: ${response.status}`);
      console.log(`📏 Content-Type: ${response.headers['content-type']}`);
      console.log(`📊 Content-Length: ${response.headers['content-length']} bytes\n`);

    } catch (error: any) {
      console.log(`❌ Erro: ${error.message}\n`);
    }
  }

  console.log('🎉 Teste concluído!');
}

testImageUrls().catch(console.error);