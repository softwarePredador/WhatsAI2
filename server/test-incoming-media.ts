import { IncomingMediaService } from './src/services/incoming-media-service';

async function testIncomingMediaService() {
  console.log('🧪 Testando IncomingMediaService...\n');

  const service = new IncomingMediaService();

  // Teste básico - verificar se o serviço inicializa
  console.log('✅ Serviço inicializado com sucesso');

  // Teste de validação de URL (usando uma URL conhecida)
  const testUrl = 'https://httpbin.org/status/200';
  const isValid = await service.validateMediaUrl(testUrl);
  console.log(`🔗 Teste de URL válida: ${isValid ? '✅' : '❌'} (${testUrl})`);

  console.log('\n🎉 Teste concluído!');
}

testIncomingMediaService().catch(console.error);