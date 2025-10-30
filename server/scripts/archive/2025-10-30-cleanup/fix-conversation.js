const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const remoteJid = '5541992360926@s.whatsapp.net';
  const conversationId = 'cmh2butjk0001jbjy0r8jfjgj';
  
  console.log('🔍 INVESTIGANDO MENSAGENS PERDIDAS PARA:', remoteJid);
  console.log('='.repeat(50));
  
  // 1. Buscar TODAS as mensagens para este remoteJid
  const allMessages = await prisma.message.findMany({
    where: { remoteJid },
    orderBy: { timestamp: 'desc' }
  });
  
  console.log(`📨 Total de mensagens para ${remoteJid}: ${allMessages.length}`);
  
  if (allMessages.length > 0) {
    // Separar mensagens com e sem conversationId
    const messagesWithConversation = allMessages.filter(msg => msg.conversationId);
    const messagesWithoutConversation = allMessages.filter(msg => !msg.conversationId);
    
    console.log(`✅ Mensagens COM conversationId: ${messagesWithConversation.length}`);
    console.log(`❌ Mensagens SEM conversationId: ${messagesWithoutConversation.length}`);
    
    console.log('\n📝 TODAS AS MENSAGENS:');
    allMessages.forEach((msg, index) => {
      console.log(`${index + 1}. [${msg.fromMe ? 'EU' : 'ELES'}] ${msg.content.substring(0, 40)}...`);
      console.log(`   📅 ${msg.timestamp}`);
      console.log(`   🔗 ConversationId: ${msg.conversationId || 'NULL'}`);
      console.log(`   📱 MessageId: ${msg.messageId}`);
      console.log(`   🏠 InstanceId: ${msg.instanceId}`);
      console.log('');
    });
    
    // Se há mensagens sem conversationId, vamos corrigir
    if (messagesWithoutConversation.length > 0) {
      console.log('🔧 CORRIGINDO MENSAGENS SEM CONVERSA LINKADA...');
      
      for (const msg of messagesWithoutConversation) {
        await prisma.message.update({
          where: { id: msg.id },
          data: { conversationId }
        });
        console.log(`✅ Mensagem ${msg.id} linkada à conversa ${conversationId}`);
      }
      
      // Atualizar lastMessage da conversa
      const latestMessage = messagesWithoutConversation[0]; // Mais recente primeiro
      if (latestMessage) {
        await prisma.conversation.update({
          where: { id: conversationId },
          data: {
            lastMessage: latestMessage.content,
            lastMessageAt: latestMessage.timestamp
          }
        });
        console.log(`✅ Conversa ${conversationId} atualizada com última mensagem`);
      }
    }
  } else {
    console.log('❌ Nenhuma mensagem encontrada para este remoteJid');
    console.log('💡 Isso significa que a mensagem nunca foi salva no banco');
  }
  
  await prisma.$disconnect();
}

main().catch(console.error);