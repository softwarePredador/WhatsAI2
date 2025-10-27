import { ConversationService } from './src/services/conversation-service';

// Simular dados de uma mensagem com imagem recebida
const mockImageMessage = {
  key: {
    remoteJid: '5511999999999@s.whatsapp.net',
    fromMe: false,
    id: 'test-image-message-' + Date.now()
  },
  messageTimestamp: Math.floor(Date.now() / 1000),
  pushName: 'Test User',
  message: {
    imageMessage: {
      url: 'https://mmg.whatsapp.net/v/t62.7118-24/1234567890.enc?ccb=11-4&oh=01_test&oe=test&_nc_sid=5e03e0&mms3=true',
      mimetype: 'image/jpeg',
      caption: 'Test image caption'
    }
  }
};

async function testImageProcessing() {
  console.log('🧪 [TEST_START] Iniciando teste de processamento de imagem');
  console.log('📝 Dados da mensagem mock:');
  console.log(`   🔗 Remote JID: ${mockImageMessage.key.remoteJid}`);
  console.log(`   👤 From Me: ${mockImageMessage.key.fromMe}`);
  console.log(`   📝 Message ID: ${mockImageMessage.key.id}`);
  console.log(`   🖼️ Has Image: ${!!mockImageMessage.message?.imageMessage}`);
  console.log(`   🔗 Image URL: ${mockImageMessage.message?.imageMessage?.url}`);
  console.log(`   🏷️ MIME Type: ${mockImageMessage.message?.imageMessage?.mimetype}`);
  console.log(`   📝 Caption: ${mockImageMessage.message?.imageMessage?.caption}`);

  try {
    const conversationService = new ConversationService();

    console.log('🚀 [TEST_CALL] Chamando handleIncomingMessage...');
    await conversationService.handleIncomingMessage('test-instance', mockImageMessage);

    console.log('✅ [TEST_SUCCESS] Teste concluído com sucesso');
  } catch (error) {
    console.error('❌ [TEST_ERROR] Erro durante o teste:', error);
  }
}

testImageProcessing();