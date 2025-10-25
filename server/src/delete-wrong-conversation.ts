import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteWrongConversation() {
  console.log('🗑️  Deletando conversa com número errado...\n');

  const wrongConv = await prisma.conversation.findFirst({
    where: {
      remoteJid: '554191188909@s.whatsapp.net' // Sem o 9 do meio (errado)
    },
    include: {
      messages: true
    }
  });

  if (wrongConv) {
    console.log(`❌ Encontrada conversa errada:`);
    console.log(`   ID: ${wrongConv.id}`);
    console.log(`   RemoteJid: ${wrongConv.remoteJid}`);
    console.log(`   Mensagens: ${wrongConv.messages.length}`);

    // Deletar mensagens primeiro
    if (wrongConv.messages.length > 0) {
      await prisma.message.deleteMany({
        where: { conversationId: wrongConv.id }
      });
      console.log(`   🗑️  ${wrongConv.messages.length} mensagens deletadas`);
    }

    // Deletar conversa
    await prisma.conversation.delete({
      where: { id: wrongConv.id }
    });

    console.log(`\n✅ Conversa errada deletada com sucesso!`);
  } else {
    console.log('✅ Nenhuma conversa errada encontrada.');
  }

  await prisma.$disconnect();
}

deleteWrongConversation();
