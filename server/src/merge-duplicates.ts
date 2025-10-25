import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function mergeDuplicateConversations() {
  console.log('🔍 Procurando conversas duplicadas para mesclar...\n');

  // Pegar todas as conversas
  const allConversations = await prisma.conversation.findMany({
    include: {
      messages: true
    }
  });

  // Agrupar por número limpo (sem @s.whatsapp.net)
  const groups = new Map<string, any[]>();
  
  allConversations.forEach(conv => {
    const cleanNumber = conv.remoteJid
      .replace('@s.whatsapp.net', '')
      .replace('@g.us', '')
      .replace('@c.us', '');
    
    if (!groups.has(cleanNumber)) {
      groups.set(cleanNumber, []);
    }
    groups.get(cleanNumber)!.push(conv);
  });

  // Encontrar grupos com duplicatas
  const duplicates = Array.from(groups.entries())
    .filter(([_, convs]) => convs.length > 1);

  console.log(`📊 Encontrados ${duplicates.length} números com conversas duplicadas\n`);

  for (const [cleanNumber, convs] of duplicates) {
    console.log(`\n🔄 Mesclando conversas para ${cleanNumber}:`);
    
    // Ordenar por: 1) tem foto, 2) tem nome, 3) mais mensagens, 4) mais recente
    const sorted = convs.sort((a, b) => {
      if (a.contactPicture && !b.contactPicture) return -1;
      if (!a.contactPicture && b.contactPicture) return 1;
      if (a.contactName && !b.contactName) return -1;
      if (!a.contactName && b.contactName) return 1;
      if (a.messages.length !== b.messages.length) {
        return b.messages.length - a.messages.length;
      }
      return b.lastMessageAt.getTime() - a.lastMessageAt.getTime();
    });

    const keep = sorted[0]; // Melhor conversa (com mais info)
    const remove = sorted.slice(1); // Conversas para remover

    console.log(`  ✅ MANTER: ${keep.remoteJid}`);
    console.log(`     Nome: ${keep.contactName || 'SEM NOME'}`);
    console.log(`     Foto: ${keep.contactPicture ? 'SIM' : 'NÃO'}`);
    console.log(`     Mensagens: ${keep.messages.length}`);

    // Normalizar o remoteJid para ter @s.whatsapp.net
    const normalizedJid = cleanNumber.includes('@')
      ? cleanNumber
      : cleanNumber + '@s.whatsapp.net';

    if (keep.remoteJid !== normalizedJid) {
      console.log(`  🔧 Normalizando ${keep.remoteJid} → ${normalizedJid}`);
      await prisma.conversation.update({
        where: { id: keep.id },
        data: { remoteJid: normalizedJid }
      });
    }

    for (const conv of remove) {
      console.log(`  ❌ REMOVER: ${conv.remoteJid} (${conv.messages.length} mensagens)`);
      
      // Mover mensagens para a conversa principal
      if (conv.messages.length > 0) {
        console.log(`     📦 Movendo ${conv.messages.length} mensagens...`);
        await prisma.message.updateMany({
          where: { conversationId: conv.id },
          data: { conversationId: keep.id }
        });
      }

      // Deletar a conversa duplicada
      await prisma.conversation.delete({
        where: { id: conv.id }
      });
    }

    console.log(`  ✅ Mesclagem concluída!`);
  }

  console.log(`\n🎉 Limpeza concluída! ${duplicates.length} grupos mesclados.`);
  
  await prisma.$disconnect();
}

mergeDuplicateConversations();
