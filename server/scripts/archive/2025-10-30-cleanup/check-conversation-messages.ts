import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkConversationMessages() {
  console.log('🔍 Verificando mensagens da conversa com 5541991188909...\n');

  try {
    // Buscar a conversa
    const conversation = await prisma.conversation.findFirst({
      where: {
        remoteJid: '5541991188909@s.whatsapp.net'
      }
    });

    if (!conversation) {
      console.log('❌ Conversa não encontrada');
      return;
    }

    console.log(`📱 Conversa encontrada: ${conversation.id}`);
    console.log(`👤 Nome do contato: ${conversation.contactName}`);
    console.log(`📅 Última mensagem: ${conversation.lastMessageAt}\n`);

    // Buscar mensagens com mídia
    const messages = await prisma.message.findMany({
      where: {
        conversationId: conversation.id,
        mediaUrl: {
          not: null
        }
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 10
    });

    console.log(`📸 Encontradas ${messages.length} mensagens com mídia:\n`);

    messages.forEach((msg, index) => {
      console.log(`${index + 1}. 📝 Tipo: ${msg.messageType}`);
      console.log(`   📄 Conteúdo: "${msg.content}"`);
      console.log(`   🔗 Media URL: ${msg.mediaUrl?.substring(0, 80)}...`);
      console.log(`   📅 Timestamp: ${msg.timestamp}`);
      console.log(`   👤 FromMe: ${msg.fromMe}\n`);
    });

    // Verificar se há mensagens com conteúdo não vazio
    const messagesWithContent = messages.filter(msg => msg.content && msg.content.trim() !== '');
    if (messagesWithContent.length > 0) {
      console.log('⚠️  ALERTA: Encontradas mensagens com conteúdo não vazio:');
      messagesWithContent.forEach(msg => {
        console.log(`   - Tipo: ${msg.messageType}, Conteúdo: "${msg.content}"`);
      });
    } else {
      console.log('✅ Todas as mensagens de mídia têm conteúdo vazio (correto!)');
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkConversationMessages().catch(console.error);