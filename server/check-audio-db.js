const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAudio() {
  try {
    const audioMessages = await prisma.message.findMany({
      where: { messageType: 'AUDIO' },
      take: 5,
      select: { id: true, mediaUrl: true, content: true }
    });

    console.log('Audio messages found:', audioMessages.length);
    audioMessages.forEach((msg, i) => {
      console.log(`${i+1}. ID: ${msg.id}`);
      console.log(`   URL: ${msg.mediaUrl ? msg.mediaUrl.substring(0, 100) + '...' : 'null'}`);
      console.log(`   Content: ${msg.content ? msg.content.substring(0, 50) + '...' : 'null'}`);
      console.log('');
    });
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAudio();