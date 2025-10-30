import { PrismaClient } from '@prisma/client';

async function analyzeDuplicates() {
  const prisma = new PrismaClient();

  try {
    // Buscar todas as mensagens para análise completa
    const messages = await prisma.message.findMany({
      where: {
        conversation: {
          remoteJid: {
            contains: '773200'
          }
        }
      },
      include: {
        conversation: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('=== ANÁLISE DETALHADA DE DUPLICATAS ===');
    console.log(`Total de mensagens analisadas: ${messages.length}`);

    // Agrupar por conteúdo
    const contentGroups: { [key: string]: any[] } = {};

    messages.forEach(msg => {
      const content = msg.content || '';
      if (!contentGroups[content]) {
        contentGroups[content] = [];
      }
      contentGroups[content].push(msg);
    });

    // Analisar cada grupo de duplicatas
    Object.entries(contentGroups).forEach(([content, msgs]) => {
      if (msgs.length > 1) {
        console.log(`\n🚨 DUPLICATA: "${content}"`);
        console.log(`   Quantidade: ${msgs.length}`);

        // Verificar se são na mesma conversa ou conversas diferentes
        const conversationIds = [...new Set(msgs.map(m => m.conversation.remoteJid))];
        console.log(`   Conversas envolvidas: ${conversationIds.length}`);
        conversationIds.forEach((convId, i) => {
          console.log(`     ${i+1}. ${convId}`);
        });

        // Mostrar timestamps
        console.log('   Timestamps:');
        msgs.forEach((msg, i) => {
          console.log(`     ${i+1}. ${msg.timestamp.toLocaleString()} (ID: ${msg.id})`);
        });
      }
    });

    // Verificar se há mensagens na mesma conversa com conteúdo similar
    console.log('\n=== VERIFICAÇÃO POR CONVERSA ===');
    const conversations = [...new Set(messages.map(m => m.conversation.remoteJid))];
    conversations.forEach(convId => {
      const convMessages = messages.filter(m => m.conversation.remoteJid === convId);
      console.log(`\n📱 Conversa: ${convId}`);
      console.log(`   Total de mensagens: ${convMessages.length}`);

      // Verificar duplicatas dentro da mesma conversa
      const convContentGroups: { [key: string]: any[] } = {};
      convMessages.forEach(msg => {
        const content = msg.content || '';
        if (!convContentGroups[content]) {
          convContentGroups[content] = [];
        }
        convContentGroups[content].push(msg);
      });

      const duplicatesInConv = Object.values(convContentGroups).filter(group => group.length > 1);
      if (duplicatesInConv.length > 0) {
        console.log(`   🚨 DUPLICATAS NESTA CONVERSA: ${duplicatesInConv.length} tipos diferentes`);
        duplicatesInConv.forEach(group => {
          console.log(`      - "${group[0].content}" (${group.length}x)`);
        });
      } else {
        console.log('   ✅ Nenhuma duplicata nesta conversa');
      }
    });

  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeDuplicates();