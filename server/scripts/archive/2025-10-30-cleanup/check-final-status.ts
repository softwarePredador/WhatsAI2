import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkMessages() {
  const messages = await prisma.message.findMany({
    where: { mediaUrl: { not: null } },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: { id: true, content: true, mediaUrl: true, messageType: true, fromMe: true }
  });

  console.log('📋 Últimas mensagens com mediaUrl:');
  messages.forEach((msg, i) => {
    const urlPreview = msg.mediaUrl ? msg.mediaUrl.substring(0, 50) + '...' : 'null';
    console.log(`${i+1}. ${msg.id}: ${msg.messageType} | Content: '${msg.content}' | URL: ${urlPreview}`);
  });

  await prisma.$disconnect();
}

checkMessages().catch(console.error);