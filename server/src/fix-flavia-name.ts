import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixFláviaName() {
  console.log('📝 Corrigindo nome da conversa da Flávia...\n');
  
  const result = await prisma.conversation.update({
    where: {
      instanceId_remoteJid: {
        instanceId: 'cmh68w7ni0003mfsiu4r2rpgs',
        remoteJid: '5541998773200@s.whatsapp.net'
      }
    },
    data: {
      contactName: 'Flávia Araújo'
    }
  });
  
  console.log('✅ Nome atualizado:', result.contactName);
  console.log('📱 remoteJid:', result.remoteJid);
  
  await prisma.$disconnect();
}

fixFláviaName().catch(console.error);
