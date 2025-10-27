import axios from 'axios';

async function testSpacesAccess() {
  console.log('🔍 Testando acesso ao DigitalOcean Spaces...\n');

  // URLs das imagens que deveriam estar funcionando
  const testUrls = [
    'https://whatsais3.sfo3.cdn.digitaloceanspaces.com/incoming/image/1761489182561_dlnx2qy80_image_cmh7rdtht000510sihfvg0t56_ycfofbpkk_1761489182561.bin',
    'https://whatsais3.sfo3.cdn.digitaloceanspaces.com/incoming/image/1761489114589_u1jib3sgq_image_cmh7svyog000212m10bzn3641_renltx1d8_1761489114589.bin',
    'https://whatsais3.sfo3.cdn.digitaloceanspaces.com/incoming/image/1761489114135_wlukgprq8_image_cmh7smwtk0002aiu6rulng4h0_6ovnpi4vy_1761489114135.bin'
  ];

  for (const url of testUrls) {
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
      console.log(`❌ Erro: ${error.response?.status || 'Unknown'} - ${error.response?.statusText || error.message}\n`);
    }
  }

  console.log('🎉 Teste concluído!');
}

testSpacesAccess().catch(console.error);