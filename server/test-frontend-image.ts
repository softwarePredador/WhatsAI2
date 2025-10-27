import { IncomingMediaService } from './src/services/incoming-media-service';

async function testFrontendImageLoading() {
  console.log('🖼️ [TEST] Testando carregamento de imagem no frontend...');

  try {
    // Pegar uma URL real dos logs
    const testImageUrl = 'https://whatsais3.sfo3.cdn.digitaloceanspaces.com/incoming/image/1761493565087_g90e3d838_image_3AC64B487E794932DBBE_jddeoe656_1761493565087.jpg';

    console.log(`🔗 Testando URL: ${testImageUrl}`);

    // Testar se a URL responde
    const response = await fetch(testImageUrl);
    console.log(`📡 Status da resposta: ${response.status}`);
    console.log(`📄 Content-Type: ${response.headers.get('content-type')}`);
    console.log(`📏 Content-Length: ${response.headers.get('content-length')}`);

    if (response.ok) {
      console.log('✅ URL está acessível e retorna imagem');
    } else {
      console.log('❌ URL não está acessível');
    }

    // Testar se conseguimos baixar o conteúdo
    const blob = await response.blob();
    console.log(`📦 Blob size: ${blob.size} bytes`);
    console.log(`📦 Blob type: ${blob.type}`);

    if (blob.size > 0 && blob.type.startsWith('image/')) {
      console.log('✅ Imagem válida baixada com sucesso');
    } else {
      console.log('❌ Problema com o conteúdo da imagem');
    }

  } catch (error) {
    console.error('❌ Erro ao testar imagem:', error);
  }
}

testFrontendImageLoading();