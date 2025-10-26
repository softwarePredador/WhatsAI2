import { ConversationService } from '../src/services/conversation-service';
import { PrismaClient } from '@prisma/client';

const databaseUrl = process.env['DATABASE_URL'];
if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is required');
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl
    }
  }
});

// Mock socket service
const mockSocketService = {
  emitToInstance: (instanceId: string, event: string, data: any) => {
    console.log(`[MOCK SOCKET] ${instanceId} -> ${event}:`, data);
  }
};

// Mock conversation repository
const mockConversationRepository = {
  findByInstanceId: async (instanceId: string) => {
    return await prisma.conversation.findMany({
      where: { instanceId }
    });
  },
  update: async (id: string, data: any) => {
    return await prisma.conversation.update({
      where: { id },
      data
    });
  },
  findById: async (id: string) => {
    return await prisma.conversation.findUnique({
      where: { id }
    });
  }
};

async function testUpdateContactFromWebhook() {
  const conversationService = new ConversationService(
    prisma as any,
    mockConversationRepository as any,
    mockSocketService as any
  );

  console.log('🧪 TESTANDO updateContactFromWebhook DIRETAMENTE...\n');

  // Teste com @lid
  console.log('Teste 1: @lid que deve ser resolvido');
  await conversationService.updateContactFromWebhook(
    'cmh73gobi0001vr6waqem8syp', // instanceId
    '79512746377469@lid', // remoteJid
    {
      contactName: 'Flávia Araújo (via @lid)',
      contactPicture: 'https://example.com/photo.jpg'
    }
  );

  console.log('\nTeste 2: @s.whatsapp.net direto');
  await conversationService.updateContactFromWebhook(
    'cmh73gobi0001vr6waqem8syp',
    '554198773200@s.whatsapp.net',
    {
      contactName: 'Flávia Araújo (direto)',
      contactPicture: 'https://example.com/photo2.jpg'
    }
  );

  // Verificar resultado
  const updated = await prisma.conversation.findUnique({
    where: { remoteJid: '554198773200@s.whatsapp.net' }
  });

  console.log('\n📋 RESULTADO FINAL:');
  console.log({
    id: updated?.id,
    remoteJid: updated?.remoteJid,
    contactName: updated?.contactName,
    contactPicture: updated?.contactPicture
  });

  await prisma.$disconnect();
}

testUpdateContactFromWebhook().catch(console.error);