const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});

async function checkAll() {
  try {
    console.log('Conectando ao banco...');

    // Verificar usuários
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true }
    });
    console.log('Total de usuários:', users.length);
    users.forEach(user => {
      console.log(`User: ${user.email}, Role: ${user.role}, ID: ${user.id}`);
    });

    // Verificar instâncias
    console.log('\nBuscando instâncias...');
    const instances = await prisma.whatsAppInstance.findMany({
      include: {
        user: {
          select: { email: true }
        }
      }
    });

    console.log('Total de instâncias encontradas:', instances.length);
    instances.forEach(inst => {
      console.log(`ID: ${inst.id}`);
      console.log(`Name: ${inst.name}`);
      console.log(`Evolution: ${inst.evolutionInstanceName}`);
      console.log(`Status: ${inst.status}`);
      console.log(`Connected: ${inst.connected}`);
      console.log(`User: ${inst.user.email}`);
      console.log(`UserID: ${inst.userId}`);
      console.log('---');
    });

    await prisma.$disconnect();
  } catch (error) {
    console.error('Erro completo:', error);
    console.error('Stack:', error.stack);
    await prisma.$disconnect();
  }
}

checkAll();