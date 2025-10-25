import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkMergedConversation() {
  const conv = await prisma.conversation.findUnique({
    where: {
      instanceId_remoteJid: {
        instanceId: 'cmh68w7ni0003mfsiu4r2rpgs',
        remoteJid: '5541998773200@s.whatsapp.net'
      }
    },
    include: {
      _count: {
        select: { messages: true }
      }
    }
  });
  
  console.log('📱 Conversa mesclada:', JSON.stringify(conv, null, 2));
  
  if (conv) {
    const messages = await prisma.message.findMany({
      where: { conversationId: conv.id },
      orderBy: { timestamp: 'asc' },
      select: {
        fromMe: true,
        content: true,
        timestamp: true
      }
    });
    
    console.log('\n📨 Mensagens:');
    messages.forEach(m => {
      const dir = m.fromMe ? '➡️ Você' : '⬅️ Ela';
      console.log(`${dir}: ${m.content} (${m.timestamp.toLocaleTimeString()})`);
    });
  }
  
  await prisma.$disconnect();
}

checkMergedConversation();
