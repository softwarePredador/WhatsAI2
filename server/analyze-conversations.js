const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeConversations() {
  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        remoteJid: {
          in: ['554191188909@s.whatsapp.net', '5541991188909@s.whatsapp.net', '554198773200@s.whatsapp.net', '5541998773200@s.whatsapp.net']
        }
      },
      include: {
        messages: {
          select: {
            id: true,
            createdAt: true
          },
          orderBy: {
            createdAt: 'asc'
          },
          take: 1
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    console.log('Análise das conversas brasileiras:');
    conversations.forEach(conv => {
      const remoteJid = conv.remoteJid.replace('@s.whatsapp.net', '');
      const normalized = remoteJid.length === 13 ? 'NORMALIZADO' : 'NÃO NORMALIZADO';
      const messageCount = conv.messages.length;
      const firstMessage = conv.messages[0] ? conv.messages[0].createdAt.toISOString() : 'Sem mensagens';

      console.log(`${remoteJid} (${normalized}) - Criada: ${conv.createdAt.toISOString()} - Mensagens: ${messageCount} - Primeira msg: ${firstMessage}`);
    });

  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeConversations();