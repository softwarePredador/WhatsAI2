import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env['DATABASE_URL']
    }
  }
});

async function main() {
  const instances = await prisma.whatsAppInstance.findMany({
    select: {
      id: true,
      name: true,
      evolutionInstanceName: true,
      status: true
    }
  });
  
  console.log('📋 INSTÂNCIAS NO BANCO:');
  console.log(JSON.stringify(instances, null, 2));
  
  await prisma.$disconnect();
}

main().catch(console.error);
