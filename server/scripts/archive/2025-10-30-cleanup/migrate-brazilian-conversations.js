const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateBrazilianConversations() {
  try {
    console.log('🔄 Iniciando migração de conversas brasileiras...');

    // Buscar todas as conversas brasileiras (que começam com 55)
    const brazilianConversations = await prisma.conversation.findMany({
      where: {
        remoteJid: {
          startsWith: '55',
          endsWith: '@s.whatsapp.net'
        }
      }
    });

    console.log(`📊 Encontradas ${brazilianConversations.length} conversas brasileiras`);

    let migrated = 0;
    let skipped = 0;

    for (const conv of brazilianConversations) {
      const currentRemoteJid = conv.remoteJid.replace('@s.whatsapp.net', '');

      // Aplicar normalização
      let normalized = currentRemoteJid;
      if (currentRemoteJid.startsWith('55')) {
        const withoutCountry = currentRemoteJid.substring(2);

        if (withoutCountry.length === 10) {
          const ddd = withoutCountry.substring(0, 2);
          const phone = withoutCountry.substring(2);
          if (phone.length === 8) {
            normalized = `55${ddd}9${phone}`;
          }
        }
      }

      const newRemoteJid = `${normalized}@s.whatsapp.net`;

      if (newRemoteJid !== conv.remoteJid) {
        console.log(`🔄 Migrando: ${conv.remoteJid} → ${newRemoteJid}`);

        // Verificar se já existe uma conversa com o remoteJid normalizado
        const existingNormalized = await prisma.conversation.findUnique({
          where: {
            instanceId_remoteJid: {
              instanceId: conv.instanceId,
              remoteJid: newRemoteJid
            }
          }
        });

        if (existingNormalized) {
          console.log(`⚠️ Já existe conversa normalizada, mesclando mensagens...`);

          // Migrar todas as mensagens para a conversa normalizada
          await prisma.message.updateMany({
            where: {
              conversationId: conv.id
            },
            data: {
              conversationId: existingNormalized.id,
              remoteJid: newRemoteJid
            }
          });

          // Atualizar lastMessage se necessário
          const lastMessage = await prisma.message.findFirst({
            where: { conversationId: existingNormalized.id },
            orderBy: { timestamp: 'desc' }
          });

          if (lastMessage) {
            await prisma.conversation.update({
              where: { id: existingNormalized.id },
              data: {
                lastMessage: lastMessage.content,
                lastMessageAt: lastMessage.timestamp,
                unreadCount: {
                  increment: conv.unreadCount
                }
              }
            });
          }

          // Deletar conversa duplicada
          await prisma.conversation.delete({
            where: { id: conv.id }
          });

          console.log(`✅ Conversa mesclada e duplicada removida`);
        } else {
          // Simplesmente atualizar o remoteJid
          await prisma.conversation.update({
            where: { id: conv.id },
            data: { remoteJid: newRemoteJid }
          });

          // Atualizar remoteJid de todas as mensagens
          await prisma.message.updateMany({
            where: { conversationId: conv.id },
            data: { remoteJid: newRemoteJid }
          });

          console.log(`✅ Conversa migrada`);
        }

        migrated++;
      } else {
        console.log(`⏭️ Conversa já normalizada: ${conv.remoteJid}`);
        skipped++;
      }
    }

    console.log(`\n🎉 Migração concluída:`);
    console.log(`   - Migradas: ${migrated}`);
    console.log(`   - Já normalizadas: ${skipped}`);
    console.log(`   - Total processadas: ${brazilianConversations.length}`);

  } catch (error) {
    console.error('❌ Erro na migração:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateBrazilianConversations();