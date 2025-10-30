import { IncomingMediaService } from './src/services/incoming-media-service';
import { mediaLogger } from './src/utils/media-logger';

async function testMediaProcessingLogs() {
  console.log('🧪 [TEST] Iniciando teste completo de processamento de mídia com logs...');

  mediaLogger.log('🎯 [TEST_SESSION_START] Sessão de teste iniciada', {
    timestamp: new Date().toISOString(),
    testType: 'full_media_processing_simulation'
  });

  try {
    // Simular dados de uma imagem recebida
    const mockImageData = {
      messageId: 'test-' + Date.now(),
      mediaUrl: 'https://mmg.whatsapp.net/v/t62.7118-24/test-image.enc?ccb=11-4&oh=test&oe=test&_nc_sid=5e03e0&mms3=true',
      mediaType: 'image' as const,
      fileName: 'test-image.jpg',
      caption: 'Imagem de teste',
      mimeType: 'image/jpeg'
    };

    mediaLogger.log('📝 [TEST_DATA] Dados simulados preparados', mockImageData);

    // Criar instância do serviço
    const incomingMediaService = new IncomingMediaService();

    mediaLogger.log('🔧 [TEST_SERVICE] IncomingMediaService criado');

    // Tentar processar (vai falhar porque a URL é fake, mas vai gerar logs)
    console.log('🚀 [TEST_PROCESS] Chamando processIncomingMedia...');
    const result = await incomingMediaService.processIncomingMedia(mockImageData);

    mediaLogger.log('📊 [TEST_RESULT] Resultado do processamento', {
      success: result !== null,
      result: result || 'null (falhou como esperado)'
    });

  } catch (error) {
    mediaLogger.error('❌ [TEST_ERROR] Erro durante teste', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
  }

  mediaLogger.log('🏁 [TEST_SESSION_END] Sessão de teste concluída');
  console.log('✅ [TEST] Teste concluído! Verifique os logs.');
}

testMediaProcessingLogs();