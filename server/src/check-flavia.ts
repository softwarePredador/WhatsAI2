import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkFlaviaConversations() {
  console.log('🔍 Procurando conversas com "Flavia" ou "Flávia"...\n');
  
  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [
        { contactName: { contains: 'Flavia', mode: 'insensitive' } },
        { contactName: { contains: 'Flávia', mode: 'insensitive' } }
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
        timestamp: true
      },
      orderBy: { timestamp: 'desc' },
      take: 5
    });

    console.log(`\n📨 Últimas 5 mensagens da conversa ${conv.id}:`);
    messages.forEach(msg => {
      const direction = msg.fromMe ? '➡️ Você' : '⬅️ Ela';
      console.log(`   ${direction}: ${msg.content?.substring(0, 50)} (${msg.timestamp.toLocaleTimeString()})`);
    });
  }

  await prisma.$disconnect();
}

checkFlaviaConversations().catch(console.error);
