import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listAllConversations() {
  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [
        { remoteJid: { contains: '91188909' } },
        { remoteJid: { contains: '41991188909' } },
        { remoteJid: { contains: '5541' } }
      ]
    },
    include: {
      messages: {
        take: 1,
        orderBy: { timestamp: 'desc' }
      }
    }
  });
  
  console.log(`\n📋 Encontradas ${conversations.length} conversas:\n`);
  
  for (const conv of conversations) {
    console.log(`ID: ${conv.id}`);
    console.log(`remoteJid: ${conv.remoteJid}`);
    console.log(`contactName: ${conv.contactName || 'NULL'}`);
    console.log(`nickname: ${(conv as any).nickname || 'NULL'}`);
    console.log(`Mensagens: ${conv.messages.length > 0 ? conv.messages.length + '+ (há mais)' : '0'}`);
    console.log(`lastMessage: ${conv.lastMessage || 'NULL'}`);
    console.log('---\n');
  }
}

listAllConversations()
  .catch(e => console.error('❌ Erro:', e))
  .finally(() => prisma.$disconnect());
