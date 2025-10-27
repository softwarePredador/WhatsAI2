import 'dotenv/config';
import { ConversationService } from './src/services/conversation-service';

// Simular processamento completo de mensagem recebida
const mockReceivedImageMessage = {
  key: {
    remoteJid: '5541991188909@s.whatsapp.net',
    fromMe: false, // MENSAGEM RECEBIDA
    id: 'test-received-image-' + Date.now()
  },
  message: {
    imageMessage: {
      url: 'https://mmg.whatsapp.net/v/t62.7118-24/test-received.enc?ccb=11-4&oh=test&oe=test&_nc_sid=5e03e0&mms3=true',
      mimetype: 'image/jpeg',
      caption: null
    }
  },
  messageTimestamp: Math.floor(Date.now() / 1000),
  pushName: 'Test Sender'
};

async function testFullMessageProcessing() {
  console.log('🧪 Testando processamento COMPLETO de mensagem recebida...');

  const conversationService = new ConversationService();

  try {
    // Simular chamada do webhook
    console.log('📨 Chamando handleIncomingMessageAtomic...');
    await conversationService.handleIncomingMessageAtomic('whatsai_6b7ac205_fee4_4da5_bebe_bcf0c552e795', mockReceivedImageMessage);

    console.log('✅ Processamento concluído!');

  } catch (error) {
    console.error('❌ Erro no processamento:', error);
  }
}

testFullMessageProcessing().catch(console.error);