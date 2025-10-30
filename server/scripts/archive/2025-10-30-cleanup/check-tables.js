const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTables() {
  try {
    // Verificar tabelas
    const tables = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name LIKE '%whatsapp%'
    `;
    console.log('Tabelas WhatsApp encontradas:', tables);

    // Verificar dados na tabela correta
    const instances = await prisma.$queryRaw`SELECT * FROM whatsapp_instances`;
    console.log('Instâncias na tabela whatsapp_instances:', instances.length);
    instances.forEach(inst => console.log(inst));

    await prisma.$disconnect();
  } catch (error) {
    console.error('Erro:', error);
    await prisma.$disconnect();
  }
}

checkTables();