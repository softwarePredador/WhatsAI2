const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestInstance() {
  try {
    const user = await prisma.user.findFirst();
    if (!user) {
      console.log('Nenhum usuário encontrado');
      return;
    }

    console.log('Usuário encontrado:', user.email);

    const instance = await prisma.whatsAppInstance.create({
      data: {
        name: 'rafaelhalder4',
        userId: user.id,
        evolutionInstanceName: 'whatsai_test_' + Date.now(),
        evolutionApiUrl: 'https://hsapi.studio',
        evolutionApiKey: 'test-key',
        status: 'PENDING',
        connected: false
      }
    });

    console.log('Instância criada:', instance);

    // Verificar se foi salva
    const savedInstance = await prisma.whatsAppInstance.findUnique({
      where: { id: instance.id }
    });

    console.log('Instância recuperada do banco:', savedInstance);

    await prisma.$disconnect();
  } catch (error) {
    console.error('Erro:', error);
    await prisma.$disconnect();
  }
}

createTestInstance();