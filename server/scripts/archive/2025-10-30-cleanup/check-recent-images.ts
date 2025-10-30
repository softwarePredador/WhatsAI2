import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkRecentImages() {
  console.log('🔍 Verificando últimas mensagens de imagem...');

  try {
    const messages = await prisma.message.findMany({
      where: { messageType: 'IMAGE' },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        content: true,
        mediaUrl: true,
        fromMe: true,
        createdAt: true,
        instanceId: true
      }
    });

    console.log(`📋 Encontradas ${messages.length} mensagens de imagem:`);
    console.log('─'.repeat(80));

    for (const msg of messages) {
      console.log(`${msg.createdAt.toISOString()}`);
      console.log(`  👤 fromMe: ${msg.fromMe}`);
      console.log(`  🔗 URL: ${msg.mediaUrl?.substring(0, 60)}...`);
      console.log(`  📝 Content: "${msg.content?.substring(0, 50)}..."`);
      console.log(`  🏠 Instance: ${msg.instanceId}`);
      console.log('');
    }

  } catch (error) {
    console.error('❌ Erro ao verificar mensagens:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRecentImages();