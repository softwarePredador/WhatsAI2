import { ConversationService } from './src/services/conversation-service';

// Teste do extractMessageContent para mensagem de imagem
const mockImageMessage = {
  key: {
    remoteJid: '5541991188909@s.whatsapp.net',
    fromMe: false,
    id: 'test-image-message'
  },
  message: {
    imageMessage: {
      url: 'https://mmg.whatsapp.net/v/t62.7118-24/test.enc',
      mimetype: 'image/jpeg',
      caption: null // Sem caption
    }
  },
  messageTimestamp: Math.floor(Date.now() / 1000),
  pushName: 'Test Sender'
};

const conversationService = new ConversationService();

// Testar extractMessageContent
const content = (conversationService as any).extractMessageContent(mockImageMessage);
const messageType = (conversationService as any).getMessageType(mockImageMessage);

console.log('📝 Content extraído:', content);
console.log('📋 MessageType:', messageType);
console.log('🖼️ Tem imageMessage:', !!mockImageMessage.message?.imageMessage);
console.log('📝 Tem caption:', !!mockImageMessage.message?.imageMessage?.caption);