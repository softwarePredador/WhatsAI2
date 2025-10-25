const { PrismaClient } = require('@prisma/client');

async function checkDatabase() {
  const prisma = new PrismaClient();

  try {
    console.log('🔍 Checking database contents...');

    // Check users
    const users = await prisma.user.findMany();
    console.log(`👥 Users: ${users.length}`);
    users.forEach(user => {
      console.log(`  - ${user.email} (ID: ${user.id})`);
    });

    // Check instances
    const instances = await prisma.whatsAppInstance.findMany();
    console.log(`📱 WhatsApp Instances: ${instances.length}`);
    instances.forEach(instance => {
      console.log(`  - ${instance.evolutionInstanceName} (ID: ${instance.id}, User: ${instance.userId})`);
    });

    // Check conversations
    const conversations = await prisma.conversation.findMany();
    console.log(`💬 Conversations: ${conversations.length}`);
    conversations.forEach(conv => {
      console.log(`  - ${conv.remoteJid} (ID: ${conv.id}, Instance: ${conv.instanceId})`);
    });

  } catch (error) {
    console.error('❌ Database check failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();