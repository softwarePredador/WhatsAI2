import { mediaLogger } from './src/utils/media-logger';

console.log('🧪 Testando MediaLogger...');

mediaLogger.log('🚀 [TEST_START] Teste do logger iniciado', {
  timestamp: new Date().toISOString(),
  test: 'media_processing_logs'
});

mediaLogger.log('📝 [TEST_INFO] Esta é uma mensagem de informação', {
  type: 'info',
  data: { key: 'value' }
});

mediaLogger.error('❌ [TEST_ERROR] Esta é uma mensagem de erro', {
  type: 'error',
  error: 'Test error message',
  code: 500
});

console.log('✅ Teste concluído! Verifique o arquivo logs/media-processing.log');