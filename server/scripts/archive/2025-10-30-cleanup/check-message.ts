import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkMessage() {
  const message = await prisma.message.findUnique({
    where: { id: 'cmh7ssock000210hiztnfofwp' },
    select: {
      id: true,
      content: true,
      mediaUrl: true,
      messageType: true,
      fromMe: true,
      createdAt: true
    }
  });

  console.log('Mensagem criada no teste:');
  console.log(JSON.stringify(message, null, 2));

  await prisma.$disconnect();
}

checkMessage().catch(console.error);