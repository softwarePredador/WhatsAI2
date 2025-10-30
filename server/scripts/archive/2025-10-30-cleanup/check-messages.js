const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const conversationId = 'cmh2butjk0001jbjy0r8jfjgj';
  
  console.log('🔍 Verificando conversa:', conversationId);
  
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { 
      messages: { 
        orderBy: { timestamp: 'desc' },
        take: 10
      } 
    }
  });
  
  if (conversation) {
    console.log('📱 RemoteJid:', conversation.remoteJid);
    console.log('📈 Total mensagens:', conversation.messages?.length || 0);
    
    if (conversation.messages && conversation.messages.length > 0) {
      console.log('\n📝 Últimas mensagens:');
      conversation.messages.forEach((msg, i) => {
        console.log(`${i+1}. [${msg.fromMe ? 'EU' : 'ELES'}] ${msg.content}`);
        console.log(`   📅 ${msg.timestamp}`);
        console.log(`   🆔 ${msg.messageId}`);
        console.log('');
      });
    } else {
      console.log('❌ Nenhuma mensagem encontrada na conversa');
      
      // Verificar se há mensagens recebidas para este remoteJid
      console.log('\n🔍 Verificando mensagens órfãs para este remoteJid...');
      const allMessages = await prisma.message.findMany({
        where: { remoteJid: conversation.remoteJid },
        orderBy: { timestamp: 'desc' },
        take: 10
      });
      
      console.log(`📨 Total mensagens para ${conversation.remoteJid}:`, allMessages.length);
      
      if (allMessages.length > 0) {
        allMessages.forEach((msg, i) => {
          console.log(`${i+1}. [${msg.fromMe ? 'EU' : 'ELES'}] ${msg.content}`);
          console.log(`   🔗 ConvId: ${msg.conversationId || 'NULL'}`);
          console.log(`   📅 ${msg.timestamp}`);
          console.log('');
        });
      }
    }
  } else {
    console.log('❌ Conversa não encontrada');
  }
  
  await prisma.$disconnect();
}

main().catch(console.error);