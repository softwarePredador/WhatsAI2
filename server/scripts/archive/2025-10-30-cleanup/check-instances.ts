import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkInstances() {
  const instances = await prisma.whatsAppInstance.findMany({
    select: { id: true, evolutionInstanceName: true },
    take: 3
  });

  console.log('Instâncias encontradas:');
  instances.forEach(i => {
    console.log(`- ${i.evolutionInstanceName} (${i.id})`);
  });

  await prisma.$disconnect();
}

checkInstances().catch(console.error);