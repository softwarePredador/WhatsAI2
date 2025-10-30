import { prisma } from './src/database/prisma';

async function checkData() {
  try {
    console.log('=== WHATSAPP INSTANCES ===');
    const instances = await prisma.whatsAppInstance.findMany();
    console.log(JSON.stringify(instances, null, 2));
    
    console.log('\n=== CONVERSATIONS ===');
    const conversations = await prisma.conversation.findMany();
    console.log(JSON.stringify(conversations, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();