import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDuplicates() {
  console.log('🔍 Procurando conversas duplicadas...\n');
  
  // Buscar todas as conversas
  const conversations = await prisma.conversation.findMany({
    where: {
      remoteJid: {
        contains: '554199118'
      }
    },
    include: {
      messages: {
        take: 2,
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  console.log(`📊 Encontradas ${conversations.length} conversas:\n`);

  conversations.forEach((conv, i) => {
    console.log(`${i + 1}. ID: ${conv.id}`);
    console.log(`   RemoteJid: ${conv.remoteJid}`);
    console.log(`   Nome: ${conv.contactName || 'SEM NOME'}`);
    console.log(`   Foto: ${conv.contactPicture ? 'TEM' : 'NÃO TEM'}`);
    console.log(`   Mensagens: ${conv.messages.length}`);
    console.log(`   Última mensagem: ${conv.lastMessage || 'nenhuma'}`);
    console.log('');
  });

  await prisma.$disconnect();
}

checkDuplicates();
