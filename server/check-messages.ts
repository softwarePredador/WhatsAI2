import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkMessages() {
  console.log('🔍 Verificando mensagens recentes...');

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { content: '[Mensagem não suportada]' },
        { mediaUrl: { not: null } }
      ]
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: {
      id: true,
      content: true,
      mediaUrl: true,
      messageType: true,
      createdAt: true,
      remoteJid: true
    }
  });

  console.log(`\n📋 Últimas ${messages.length} mensagens com mídia ou '[Mensagem não suportada]':\n`);

  messages.forEach((msg, index) => {
    console.log(`${index + 1}. ID: ${msg.id}`);
    console.log(`   Conteúdo: ${msg.content}`);
    console.log(`   MediaUrl: ${msg.mediaUrl}`);
    console.log(`   MessageType: ${msg.messageType}`);
    console.log(`   RemoteJid: ${msg.remoteJid}`);
    console.log(`   Criado: ${msg.createdAt}`);
    console.log('---');
  });

  await prisma.$disconnect();
}

checkMessages().catch(console.error);