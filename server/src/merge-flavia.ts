import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function mergeFláviaConversations() {
  console.log('🔍 Mesclando conversas da Flávia Araújo...\n');
  
  // ID correto: 5541998773200@s.whatsapp.net
  const correctRemoteJid = '5541998773200@s.whatsapp.net';
  const wrongRemoteJid = '79512746377469@s.whatsapp.net';
  
  const instanceId = 'cmh68w7ni0003mfsiu4r2rpgs'; // DB ID da instância
  
  // 1. Buscar conversa correta (pode não existir ainda)
  let correctConversation = await prisma.conversation.findUnique({
    where: {
      instanceId_remoteJid: {
        instanceId,
        remoteJid: correctRemoteJid
      }
    }
  });
  
  // 2. Buscar conversa errada
  const wrongConversation = await prisma.conversation.findUnique({
    where: {
      instanceId_remoteJid: {
        instanceId,
        remoteJid: wrongRemoteJid
      }
    }
  });
  
  if (!wrongConversation) {
    console.log('❌ Conversa errada não encontrada:', wrongRemoteJid);
    return;
  }
  
  console.log('✅ Conversa errada encontrada:', wrongConversation.id);
  console.log('   - remoteJid:', wrongConversation.remoteJid);
  console.log('   - contactName:', wrongConversation.contactName);
  console.log('   - Mensagens:', await prisma.message.count({ where: { conversationId: wrongConversation.id } }));
  
  // 3. Criar ou atualizar conversa correta
  if (!correctConversation) {
    console.log('\n📝 Criando conversa correta...');
    correctConversation = await prisma.conversation.create({
      data: {
        instanceId,
        remoteJid: correctRemoteJid,
        contactName: 'Flávia Araújo',
        contactPicture: wrongConversation.contactPicture,
        isGroup: false,
        lastMessage: wrongConversation.lastMessage,
        lastMessageAt: wrongConversation.lastMessageAt,
        unreadCount: wrongConversation.unreadCount,
        isArchived: wrongConversation.isArchived,
        isPinned: wrongConversation.isPinned
      }
    });
    console.log('✅ Conversa correta criada:', correctConversation.id);
  } else {
    console.log('\n✅ Conversa correta já existe:', correctConversation.id);
  }
  
  // 4. Mover todas as mensagens da conversa errada para a correta
  const messages = await prisma.message.findMany({
    where: { conversationId: wrongConversation.id }
  });
  
  console.log(`\n🔄 Movendo ${messages.length} mensagens...`);
  
  for (const message of messages) {
    await prisma.message.update({
      where: { id: message.id },
      data: {
        conversationId: correctConversation.id,
        remoteJid: correctRemoteJid // Corrigir remoteJid também
      }
    });
  }
  
  console.log(`✅ ${messages.length} mensagens movidas!`);
  
  // 5. Atualizar lastMessage da conversa correta
  const lastMessage = await prisma.message.findFirst({
    where: { conversationId: correctConversation.id },
    orderBy: { timestamp: 'desc' }
  });
  
  if (lastMessage) {
    await prisma.conversation.update({
      where: { id: correctConversation.id },
      data: {
        lastMessage: lastMessage.content,
        lastMessageAt: lastMessage.timestamp
      }
    });
    console.log('📝 lastMessage atualizado:', lastMessage.content);
  }
  
  // 6. Deletar conversa errada
  await prisma.conversation.delete({
    where: { id: wrongConversation.id }
  });
  
  console.log('🗑️  Conversa errada deletada!');
  console.log('\n🎉 Mesclagem concluída!');
  
  await prisma.$disconnect();
}

mergeFláviaConversations().catch(console.error);
