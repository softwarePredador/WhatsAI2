import 'dotenv/config';
import { ConversationService } from './src/services/conversation-service';

// Simular uma mensagem recebida (fromMe: false) com imagem
const mockReceivedMessageData = {
  key: {
    remoteJid: '5541991188909@s.whatsapp.net',
    fromMe: false, // MENSAGEM RECEBIDA
    id: 'test-received-message-123'
  },
  message: {
    imageMessage: {
      url: 'https://mmg.whatsapp.net/v/t62.7118-24/test-received.enc?ccb=11-4&oh=test&oe=test&_nc_sid=5e03e0&mms3=true',
      mimetype: 'image/jpeg',
      caption: 'Imagem recebida de teste'
    }
  },
  messageTimestamp: Math.floor(Date.now() / 1000),
  pushName: 'Test Sender'
};

async function testReceivedMessageProcessing() {
  console.log('🧪 Testando processamento de mensagem RECEBIDA com mídia...');

  const conversationService = new ConversationService();

  try {
    console.log('📨 Simulando handleIncomingMessage para mensagem recebida...');

    // Verificar se os métodos auxiliares funcionam
    const mediaType = (conversationService as any).getMediaType(mockReceivedMessageData);
    const mimeType = (conversationService as any).getMimeType(mockReceivedMessageData);

    console.log(`📷 MediaType detectado: ${mediaType}`);
    console.log(`📎 MimeType detectado: ${mimeType}`);
    console.log(`🔗 MediaUrl presente: ${!!mockReceivedMessageData.message?.imageMessage?.url}`);
    console.log(`👤 FromMe: ${mockReceivedMessageData.key.fromMe} (deve ser false para processamento)`);

    // Verificar se a condição seria atendida
    const wouldProcess = mockReceivedMessageData.message?.imageMessage?.url && !mockReceivedMessageData.key.fromMe;
    console.log(`✅ Condição para processamento: ${wouldProcess}`);

    if (wouldProcess) {
      console.log('🎯 IncomingMediaService SERIA chamado para esta mensagem!');
    } else {
      console.log('❌ IncomingMediaService NÃO seria chamado');
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testReceivedMessageProcessing().catch(console.error);