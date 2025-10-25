import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function mergeSpecificConversation() {
  console.log('🔧 Mesclando conversas 554191188909...\n');
  
  // Buscar as duas conversas
  const wrongConv = await prisma.conversation.findFirst({
    where: {
      remoteJid: '554191188909@s.whatsapp.net',
      instanceId: 'cmh68w7ni0003mfsiu4r2rpgs'
    },
    include: { messages: true }
  });
  
  const correctConv = await prisma.conversation.findFirst({
    where: {
      remoteJid: '5541991188909@s.whatsapp.net',
      instanceId: 'cmh68w7ni0003mfsiu4r2rpgs'
    },
    include: { messages: true }
  });
  
  console.log('📊 Conversa ERRADA (sem 9):', wrongConv ? `${wrongConv.id} (${wrongConv.messages.length} msgs)` : 'NÃO ENCONTRADA');
  console.log('📊 Conversa CORRETA (com 9):', correctConv ? `${correctConv.id} (${correctConv.messages.length} msgs)` : 'NÃO ENCONTRADA');
  
  if (!wrongConv && !correctConv) {
    console.log('\n❌ Nenhuma conversa encontrada!');
    return;
  }
  
  if (!correctConv) {
    // Criar a conversa correta renomeando a errada
    console.log('\n🔄 Criando conversa correta...');
    await prisma.conversation.update({
      where: { id: wrongConv!.id },
      data: { remoteJid: '5541991188909@s.whatsapp.net' }
    });
    console.log('✅ Conversa corrigida!');
    return;
  }
  
  if (!wrongConv) {
    console.log('\n✅ Apenas a conversa correta existe!');
    return;
  }
  
  // Mover mensagens
  console.log(`\n🔄 Movendo ${wrongConv.messages.length} mensagens...`);
  await prisma.message.updateMany({
    where: { conversationId: wrongConv.id },
    data: { conversationId: correctConv.id }
  });
  
  // Atualizar lastMessage
  if (wrongConv.lastMessageAt && (!correctConv.lastMessageAt || wrongConv.lastMessageAt > correctConv.lastMessageAt)) {
    console.log('📝 Atualizando lastMessage...');
    await prisma.conversation.update({
      where: { id: correctConv.id },
      data: {
        lastMessage: wrongConv.lastMessage,
        lastMessageAt: wrongConv.lastMessageAt
      }
    });
  }
  
  // Deletar conversa errada
  console.log('🗑️  Deletando conversa duplicada...');
  await prisma.conversation.delete({ where: { id: wrongConv.id } });
  
  console.log('\n🎉 Conversas mescladas com sucesso!');
}

mergeSpecificConversation()
  .catch(e => console.error('❌ Erro:', e))
  .finally(() => prisma.$disconnect());
