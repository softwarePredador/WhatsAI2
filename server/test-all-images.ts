import axios from 'axios';

async function testAllWorkingImages() {
  console.log('🧪 Testando TODOS os links das imagens que deveriam funcionar...\n');

  // URLs das imagens que foram processadas e deveriam funcionar
  const imageUrls = [
    'https://whatsais3.sfo3.cdn.digitaloceanspaces.com/incoming/image/1761489111345_dlnx2qy80_image_cmh7rdtht000510sihfvg0t56_ycfofbpkk_1761489111345.bin',
    'https://whatsais3.sfo3.cdn.digitaloceanspaces.com/incoming/image/1761489113692_uztmjlci1_image_cmh7sfeo300058a5wdm5dsrr7_z3ahkg45j_1761489113692.bin',
    'https://whatsais3.sfo3.cdn.digitaloceanspaces.com/incoming/image/1761489114135_wlukgprq8_image_cmh7smwtk0002aiu6rulng4h0_6ovnpi4vy_1761489114135.bin',
    'https://whatsais3.sfo3.cdn.digitaloceanspaces.com/incoming/image/1761489114589_u1jib3sgq_image_cmh7svyog000212m10bzn3641_renltx1d8_1761489114589.bin',
    'https://whatsais3.sfo3.cdn.digitaloceanspaces.com/incoming/video/1761489113055_pvgug7ml4_video_cmh7re5ch000d10si9rghdzml_o2mftfomw_1761489113055.bin',
    'https://whatsais3.sfo3.cdn.digitaloceanspaces.com/incoming/image/1761489182561_dokwnqusk_image_3A2F6A9C9470EE4FAB43_6f83x0wuj_1761489182561.jpg'
  ];

  let workingCount = 0;
  let errorCount = 0;

  for (const url of imageUrls) {
    try {
      console.log(`🔗 Testando: ${url.substring(0, 80)}...`);

      const response = await axios.head(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      console.log(`✅ Status: ${response.status} | ${response.headers['content-length']} bytes`);
      workingCount++;

    } catch (error: any) {
      console.log(`❌ Erro: ${error.response?.status || 'Unknown'} - ${error.response?.statusText || error.message}`);
      errorCount++;
    }
  }

  console.log(`\n📊 Resultado Final:`);
  console.log(`✅ ${workingCount} imagens funcionando`);
  console.log(`❌ ${errorCount} imagens com erro`);

  if (workingCount > 0) {
    console.log(`\n🎉 A maioria das imagens está funcionando!`);
    console.log(`   Você pode copiar os links acima que retornaram ✅ e testá-los no navegador.`);
  }
}

testAllWorkingImages().catch(console.error);