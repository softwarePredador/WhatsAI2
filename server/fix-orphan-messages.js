const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixOrphanMessages() {
  console.log('🔧 Corrigindo mensagens órfãs...\n');
  
  try {
    // 1. Buscar todas as mensagens órfãs
    const orphanMessages = await prisma.message.findMany({
      where: {
        conversationId: null
      },
      orderBy: { timestamp: 'asc' }
    });
    
    console.log(`📋 Total de mensagens órfãs: ${orphanMessages.length}\n`);
    
    let fixed = 0;
    
    for (const message of orphanMessages) {
      // Para cada mensagem órfã, encontrar ou criar a conversa
      const conversation = await prisma.conversation.upsert({
        where: {
          instanceId_remoteJid: {
            instanceId: message.instanceId,
            remoteJid: message.remoteJid
          }
        },
        create: {
          instanceId: message.instanceId,
          remoteJid: message.remoteJid,
          isGroup: message.remoteJid.includes('@g.us'),
          lastMessage: message.content,
          lastMessageAt: message.timestamp,
          unreadCount: 0,
        },
        update: {}
      });
      
      // Atualizar a mensagem para vincular à conversa
      await prisma.message.update({
        where: {
          id: message.id
        },
        data: {
          conversationId: conversation.id
        }
      });
      
      fixed++;
      console.log(`✅ ${fixed}/${orphanMessages.length} - Vinculada mensagem ${message.id} à conversa ${conversation.id}`);
    }
    
    // Agora atualizar as conversas com a última mensagem correta
    console.log('\n🔄 Atualizando últimas mensagens das conversas...');
    
    const conversations = await prisma.conversation.findMany({
      include: {
        messages: {
          take: 1,
          orderBy: { timestamp: 'desc' }
        }
      }
    });
    
    for (const conv of conversations) {
      if (conv.messages.length > 0) {
        const lastMessage = conv.messages[0];
        await prisma.conversation.update({
          where: { id: conv.id },
          data: {
            lastMessage: lastMessage.content,
            lastMessageAt: lastMessage.timestamp
          }
        });
        console.log(`✅ Conversa ${conv.id} atualizada com última mensagem`);
      }
    }
    
    console.log('\n🎉 Correção concluída!');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixOrphanMessages();