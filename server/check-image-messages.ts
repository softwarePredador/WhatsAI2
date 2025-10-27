import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkImageMessages() {
  console.log('🔍 Verificando mensagens de imagem...');

  const messages = await prisma.message.findMany({
    where: {
      messageType: 'imageMessage'
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true,
      content: true,
      mediaUrl: true,
      messageType: true,
      createdAt: true,
      remoteJid: true,
      fromMe: true
    }
  });

  console.log(`\n📋 Últimas ${messages.length} mensagens de imagem:\n`);

  messages.forEach((msg, index) => {
    console.log(`${index + 1}. ID: ${msg.id}`);
    console.log(`   Tipo: ${msg.messageType}`);
    console.log(`   Conteúdo: ${msg.content}`);
    console.log(`   MediaUrl: ${msg.mediaUrl}`);
    console.log(`   FromMe: ${msg.fromMe}`);
    console.log(`   RemoteJid: ${msg.remoteJid}`);
    console.log(`   Criado: ${msg.createdAt}`);
    console.log('---');
  });

  await prisma.$disconnect();
}

checkImageMessages().catch(console.error);