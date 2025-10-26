import { PrismaClient } from '@prisma/client';

async function checkGroup() {
  const prisma = new PrismaClient();

  try {
    const contacts = await prisma.contact.findMany({
      where: { jid: '120363129197033819@g.us' }
    });

    console.log('Contacts found:', contacts);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkGroup();