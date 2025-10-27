import axios from 'axios';

async function testUserProcessedImages() {
  console.log('🧪 Testando imagens processadas do usuário...\n');

  // URLs das imagens que acabaram de ser processadas
  const imageUrls = [
    'https://whatsais3.sfo3.cdn.digitaloceanspaces.com/incoming/image/1761489111345_dlnx2qy80_image_cmh7rdtht000510sihfvg0t56_ycfofbpkk_1761489111345.bin',
    'https://whatsais3.sfo3.cdn.digitaloceanspaces.com/incoming/image/1761489113692_uztmjlci1_image_cmh7sfeo300058a5wdm5dsrr7_z3ahkg45j_1761489113692.bin',
    'https://whatsais3.sfo3.cdn.digitaloceanspaces.com/incoming/image/1761489114135_wlukgprq8_image_cmh7smwtk0002aiu6rulng4h0_6ovnpi4vy_1761489114135.bin',
    'https://whatsais3.sfo3.cdn.digitaloceanspaces.com/incoming/image/1761489114589_u1jib3sgq_image_cmh7svyog000212m10bzn3641_renltx1d8_1761489114589.bin'
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

testUserProcessedImages().catch(console.error);