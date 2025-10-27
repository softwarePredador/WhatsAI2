import { ConversationService } from './src/services/conversation-service';

async function testMediaProcessing() {
  console.log('🧪 Testando processamento de mensagens de mídia...\n');

  const conversationService = new ConversationService();

  // Simular dados de uma mensagem de imagem recebida
  const mockImageMessage = {
    key: {
      remoteJid: '5541998773200@s.whatsapp.net',
      fromMe: false,
      id: 'test_image_' + Date.now(),
      participant: '5541998773200@s.whatsapp.net'
    },
    pushName: 'Test User',
    message: {
      imageMessage: {
        url: 'https://httpbin.org/image/jpeg', // URL de teste que retorna uma imagem
        mimetype: 'image/jpeg',
        caption: 'Teste de imagem'
      }
    },
    messageTimestamp: Math.floor(Date.now() / 1000),
    messageType: 'imageMessage'
  };

  try {
    console.log('📤 Enviando mensagem de imagem simulada...');
    await conversationService.handleIncomingMessageAtomic('test-instance', mockImageMessage);
    console.log('✅ Mensagem processada com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao processar mensagem:', error);
  }
}

testMediaProcessing().catch(console.error);