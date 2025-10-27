import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkMessagesForNumber() {
  try {
    console.log('🔍 Verificando mensagens para o número 91188909...\n');

    // Buscar conversas que contenham esse número
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { remoteJid: { contains: '91188909' } },
          { contactName: { contains: '91188909' } }
        ]
      },
      include: {
        messages: {
          where: {
            messageType: {
              in: ['IMAGE', 'VIDEO', 'AUDIO', 'STICKER']
            }
          },
          orderBy: {
            timestamp: 'desc'
          },
          take: 10
        },
        _count: {
          select: { messages: true }
        }
      }
    });

    console.log(`📊 Encontradas ${conversations.length} conversas relacionadas ao número 91188909:\n`);

    conversations.forEach((conv, index) => {
      console.log(`${index + 1}. Conversa: ${conv.contactName || conv.remoteJid}`);
      console.log(`   ID: ${conv.id}`);
      console.log(`   RemoteJID: ${conv.remoteJid}`);
      console.log(`   Grupo: ${conv.isGroup ? 'Sim' : 'Não'}`);
      console.log(`   Total de mensagens: ${conv._count.messages}`);
      console.log(`   Mensagens de mídia: ${conv.messages.length}`);

      if (conv.messages.length > 0) {
        console.log('   📎 Últimas mídias:');
        conv.messages.forEach((msg, msgIndex) => {
          console.log(`      ${msgIndex + 1}. ${msg.messageType} - ${msg.timestamp.toISOString()}`);
          console.log(`         Conteúdo: "${msg.content?.substring(0, 50)}${msg.content && msg.content.length > 50 ? '...' : ''}"`);
          console.log(`         MediaUrl: ${msg.mediaUrl ? '✅ Presente' : '❌ Ausente'}`);
          console.log(`         FileName: ${msg.fileName || 'N/A'}`);
          console.log('');
        });
      }
      console.log('');
    });

    // Buscar todas as mensagens de mídia recentes
    console.log('🔍 Buscando todas as mensagens de mídia recentes (últimas 24h)...');
    const recentMediaMessages = await prisma.message.findMany({
      where: {
        messageType: {
          in: ['IMAGE', 'VIDEO', 'AUDIO', 'STICKER']
        },
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Últimas 24 horas
        }
      },
      include: {
        conversation: {
          select: {
            remoteJid: true,
            contactName: true,
            isGroup: true
          }
        }
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 20
    });

    console.log(`\n📱 Últimas ${recentMediaMessages.length} mensagens de mídia:`);
    recentMediaMessages.forEach((msg, index) => {
      console.log(`${index + 1}. ${msg.messageType} - ${msg.timestamp.toISOString()}`);
      console.log(`   Conversa: ${msg.conversation.contactName || msg.conversation.remoteJid}`);
      console.log(`   RemoteJID: ${msg.conversation.remoteJid}`);
      console.log(`   MediaUrl: ${msg.mediaUrl ? '✅ Presente' : '❌ Ausente'}`);
      console.log(`   Conteúdo: "${msg.content?.substring(0, 50)}${msg.content && msg.content.length > 50 ? '...' : ''}"`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Erro ao verificar mensagens:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMessagesForNumber();