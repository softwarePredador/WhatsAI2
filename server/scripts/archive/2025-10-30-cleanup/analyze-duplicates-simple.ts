import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function analyzeDuplicates() {
  try {
    console.log('🔍 Analisando duplicatas de mensagens...\n');

    // Buscar todas as mensagens agrupadas por conteúdo
    const messages = await prisma.message.findMany({
      select: {
        id: true,
        content: true,
        conversationId: true,
        timestamp: true,
        messageId: true,
        createdAt: true,
        conversation: {
          select: {
            id: true,
            remoteJid: true,
            contactName: true,
            isGroup: true
          }
        }
      },
      orderBy: {
        content: 'asc'
      }
    });

    // Agrupar por conteúdo
    const contentGroups = new Map<string, any[]>();

    messages.forEach(msg => {
      if (!msg.content || msg.content.trim() === '') return;

      const key = msg.content.trim().toLowerCase();
      if (!contentGroups.has(key)) {
        contentGroups.set(key, []);
      }
      contentGroups.get(key)!.push(msg);
    });

    // Filtrar apenas grupos com duplicatas
    const duplicates = Array.from(contentGroups.entries())
      .filter(([_, msgs]) => msgs.length > 1)
      .sort((a, b) => b[1].length - a[1].length);

    console.log(`📊 Encontradas ${duplicates.length} mensagens duplicadas:\n`);

    duplicates.forEach(([content, msgs], index) => {
      console.log(`${index + 1}. "${content}" (${msgs.length}x)`);

      // Agrupar por conversa
      const byConversation = new Map<string, any[]>();
      msgs.forEach(msg => {
        const convKey = `${msg.conversation.remoteJid} (${msg.conversation.contactName || 'Sem nome'})`;
        if (!byConversation.has(convKey)) {
          byConversation.set(convKey, []);
        }
        byConversation.get(convKey)!.push(msg);
      });

      // Verificar se duplicatas estão na mesma conversa ou em conversas diferentes
      const conversationCount = byConversation.size;
      const totalMessages = msgs.length;

      if (conversationCount === 1) {
        console.log(`   ❌ TODAS as ${totalMessages} duplicatas estão na MESMA conversa:`);
      } else {
        console.log(`   ⚠️  Duplicatas distribuídas em ${conversationCount} conversas diferentes:`);
      }

      byConversation.forEach((convMsgs, convName) => {
        console.log(`      - ${convName}: ${convMsgs.length} mensagens`);
        convMsgs.forEach(msg => {
          console.log(`        • ID: ${msg.id}, Timestamp: ${msg.timestamp.toISOString()}, MessageId: ${msg.messageId}`);
        });
      });

      console.log('');
    });

    // Estatísticas finais
    const totalDuplicateMessages = duplicates.reduce((sum, [_, msgs]) => sum + msgs.length, 0);
    const sameConversationDuplicates = duplicates.filter(([_, msgs]) => {
      const convIds = new Set(msgs.map(m => m.conversationId));
      return convIds.size === 1;
    }).length;

    const crossConversationDuplicates = duplicates.length - sameConversationDuplicates;

    console.log('📈 Estatísticas Finais:');
    console.log(`   • Total de mensagens duplicadas: ${totalDuplicateMessages}`);
    console.log(`   • Grupos de duplicatas dentro da mesma conversa: ${sameConversationDuplicates}`);
    console.log(`   • Grupos de duplicatas entre conversas diferentes: ${crossConversationDuplicates}`);

    if (crossConversationDuplicates > 0) {
      console.log('\n🚨 PROBLEMA IDENTIFICADO: Existem duplicatas entre conversas diferentes!');
      console.log('   Isso indica que o Evolution API está enviando a mesma mensagem múltiplas vezes');
      console.log('   ou que a lógica de deduplicação não está funcionando corretamente.');
    }

    if (sameConversationDuplicates > 0) {
      console.log('\n⚠️  PROBLEMA IDENTIFICADO: Existem duplicatas dentro da mesma conversa!');
      console.log('   Isso pode indicar problemas na lógica de upsert ou no Evolution API.');
    }

  } catch (error) {
    console.error('❌ Erro ao analisar duplicatas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeDuplicates();