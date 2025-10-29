import { IncomingMediaService } from './src/services/incoming-media-service';

async function testImageProcessing() {
  console.log('🧪 [TEST] Iniciando teste de processamento de imagem...');

  const service = new IncomingMediaService();

  // Testar com uma URL de imagem de teste (usando uma imagem pública)
  const testImageUrl = 'https://picsum.photos/200/300.jpg'; // Imagem de teste pública

  try {
    console.log('📥 [TEST] Testando download de imagem...');
    const result = await service.processIncomingMedia({
      messageId: 'test_message_123',
      mediaUrl: testImageUrl,
      mediaType: 'image',
      fileName: 'test_image.jpg',
      mimeType: 'image/jpeg'
    });

    console.log('✅ [TEST] Processamento concluído com sucesso!');
    console.log('🔗 [TEST] URL resultante:', result);

    if (result) {
      console.log('🎉 [TEST] Imagem processada e armazenada com sucesso!');
    } else {
      console.log('⚠️ [TEST] Processamento falhou - retornou null');
    }

  } catch (error) {
    console.error('❌ [TEST] Erro durante o teste:', error);
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  testImageProcessing().catch(console.error);
}

export { testImageProcessing };