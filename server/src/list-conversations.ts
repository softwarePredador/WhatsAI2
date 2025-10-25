import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listConversations() {
  const convs = await prisma.conversation.findMany({
    orderBy: { lastMessageAt: 'desc' }
  });

  console.log(`\n📊 Total de conversas: ${convs.length}\n`);

  convs.forEach((conv, i) => {
    console.log(`${i + 1}. RemoteJid: "${conv.remoteJid}"`);
    console.log(`   Nome: ${conv.contactName || 'SEM NOME'}`);
    console.log(`   Foto: ${conv.contactPicture ? 'SIM' : 'NÃO'}`);
    console.log(`   Última msg: ${conv.lastMessage || 'nenhuma'}`);
    console.log('');
  });

  await prisma.$disconnect();
}

listConversations();
