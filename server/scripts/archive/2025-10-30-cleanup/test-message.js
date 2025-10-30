const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testMessage() {
  try {
    // Buscar uma conversa existente
    const conversation = await prisma.conversation.findFirst();
    if (!conversation) {
      console.log('Nenhuma conversa encontrada');
      return;
    }

    console.log('Conversa encontrada:', conversation.id, conversation.remoteJid);

    // Criar uma mensagem de teste
    const message = await prisma.message.create({
      data: {
        instanceId: conversation.instanceId,
        remoteJid: conversation.remoteJid,
        conversationId: conversation.id,
        fromMe: false,
        messageType: 'TEXT',
        content: 'Mensagem de teste para atualizar lista',
        messageId: 'test_' + Date.now(),
        timestamp: new Date(),
        status: 'DELIVERED'
      }
    });

    console.log('Mensagem criada:', message.id);

    // Atualizar a conversa
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessage: message.content,
        lastMessageAt: message.timestamp,
        unreadCount: { increment: 1 }
      }
    });

    console.log('Conversa atualizada');

  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testMessage();