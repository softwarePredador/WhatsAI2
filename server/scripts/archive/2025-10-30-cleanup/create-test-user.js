const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function createTestUser() {
  const prisma = new PrismaClient();

  try {
    console.log('👤 Creating test user...');

    // Hash password
    const hashedPassword = await bcrypt.hash('test123', 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: `testuser${Date.now()}@example.com`,
        password: hashedPassword,
        name: 'Test User'
      }
    });

    console.log('✅ Test user created:', user.email);

    // Create a WhatsApp instance for the user
    const instance = await prisma.whatsAppInstance.create({
      data: {
        userId: user.id,
        evolutionInstanceName: 'test_instance_123',
        name: 'Test Instance',
        evolutionApiUrl: 'http://localhost:8080',
        evolutionApiKey: 'test-key'
      }
    });

    console.log('✅ WhatsApp instance created:', instance.evolutionInstanceName);

    // Create a test conversation
    const conversation = await prisma.conversation.create({
      data: {
        instanceId: instance.id,
        remoteJid: '5511999999999@s.whatsapp.net',
        nickname: 'Test Contact'
      }
    });

    console.log('✅ Test conversation created:', conversation.remoteJid);

  } catch (error) {
    console.error('❌ Failed to create test user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();