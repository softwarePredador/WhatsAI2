import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkRafaConversations() {
  console.log('🔍 Procurando conversas com "Rafa"...\n');
  
  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [
        { contactName: { contains: 'Rafa', mode: 'insensitive' } },
        { remoteJid: { contains: '5541991188909' } },
        { remoteJid: { contains: '554191188909' } }
      ]
    },
    include: {
      _count: {
        select: { messages: true }
      }
    },
    orderBy: {
      lastMessageAt: 'desc'
    }
  });

  console.log(`📊 Encontradas ${conversations.length} conversas:\n`);

  for (const conv of conversations) {
    console.log(`🗨️  Conversa ID: ${conv.id}`);
    console.log(`   📱 remoteJid: ${conv.remoteJid}`);
    console.log(`   👤 contactName: ${conv.contactName}`);
    console.log(`   💬 Mensagens: ${conv._count.messages}`);
    console.log(`   📅 Última msg: ${conv.lastMessageAt?.toLocaleString() || 'nunca'}`);
    console.log(`   📝 Última msg texto: ${conv.lastMessage || 'vazio'}`);
    console.log('');
  }

  // Verificar mensagens de cada conversa
  for (const conv of conversations) {
    const messages = await prisma.message.findMany({
      where: { conversationId: conv.id },
      select: {
        id: true,
        fromMe: true,
        content: true,
        timestamp: true,
        remoteJid: true
      },
      orderBy: { timestamp: 'desc' },
      take: 10
    });

    console.log(`\n📨 Últimas 10 mensagens da conversa ${conv.id}:`);
    messages.forEach(msg => {
      const direction = msg.fromMe ? '➡️ Você' : '⬅️ Rafa';
      console.log(`   ${direction}: ${msg.content?.substring(0, 50)} | remoteJid: ${msg.remoteJid} (${msg.timestamp.toLocaleTimeString()})`);
    });
  }

  await prisma.$disconnect();
}

checkRafaConversations().catch(console.error);
