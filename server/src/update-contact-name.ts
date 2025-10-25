import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateContactName() {
  console.log('📝 Atualizando nome do contato...\n');

  const conv = await prisma.conversation.findFirst({
    where: {
      remoteJid: '5541991188909@s.whatsapp.net'
    }
  });

  if (conv) {
    // Buscar mensagem com pushName
    const message = await prisma.message.findFirst({
      where: {
        conversationId: conv.id,
        remoteJid: '5541991188909@s.whatsapp.net'
      }
    });

    console.log(`✅ Conversa encontrada:`);
    console.log(`   ID: ${conv.id}`);
    console.log(`   RemoteJid: ${conv.remoteJid}`);
    console.log(`   Nome atual: ${conv.contactName || 'SEM NOME'}`);
    console.log(`   Foto: ${conv.contactPicture ? 'SIM' : 'NÃO'}`);

    // Como não temos pushName armazenado, vamos buscar da Evolution API via fetch
    console.log(`\n📞 O pushName virá automaticamente na próxima mensagem recebida!`);
    console.log(`   Por enquanto, a conversa terá apenas o número.`);

  } else {
    console.log('❌ Conversa não encontrada.');
  }

  await prisma.$disconnect();
}

updateContactName();
