import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function analyzeMediaMessages() {
  try {
    console.log('🔍 Analisando mensagens de mídia no banco de dados...\n');

    // Buscar todas as mensagens de mídia
    const mediaMessages = await prisma.message.findMany({
      where: {
        messageType: {
          in: ['IMAGE', 'VIDEO', 'AUDIO', 'STICKER', 'DOCUMENT']
        }
      },
      select: {
        id: true,
        content: true,
        messageType: true,
        mediaUrl: true,
        fileName: true,
        caption: true,
        fromMe: true,
        timestamp: true,
        messageId: true,
        conversation: {
          select: {
            remoteJid: true,
            contactName: true,
            isGroup: true
          }
        }
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 50 // Últimas 50 mensagens de mídia
    });

    console.log(`📊 Encontradas ${mediaMessages.length} mensagens de mídia:\n`);

    // Agrupar por tipo
    const byType = new Map<string, typeof mediaMessages>();

    mediaMessages.forEach(msg => {
      if (!byType.has(msg.messageType)) {
        byType.set(msg.messageType, []);
      }
      byType.get(msg.messageType)!.push(msg);
    });

    // Estatísticas por tipo
    console.log('📈 Estatísticas por tipo de mídia:');
    byType.forEach((msgs, type) => {
      const withMediaUrl = msgs.filter(m => m.mediaUrl).length;
      const withoutMediaUrl = msgs.filter(m => !m.mediaUrl).length;

      console.log(`   ${type}: ${msgs.length} mensagens`);
      console.log(`      • Com mediaUrl: ${withMediaUrl}`);
      console.log(`      • Sem mediaUrl: ${withoutMediaUrl}`);
      console.log('');
    });

    // Mostrar exemplos de cada tipo
    console.log('📋 Exemplos de mensagens de mídia:');
    byType.forEach((msgs, type) => {
      console.log(`\n🖼️  ${type}:`);
      msgs.slice(0, 3).forEach((msg, index) => {
        console.log(`   ${index + 1}. ID: ${msg.id}`);
        console.log(`      Conteúdo: "${msg.content?.substring(0, 50)}${msg.content && msg.content.length > 50 ? '...' : ''}"`);
        console.log(`      MediaUrl: ${msg.mediaUrl ? '✅ Presente' : '❌ Ausente'}`);
        console.log(`      FileName: ${msg.fileName || 'N/A'}`);
        console.log(`      Caption: ${msg.caption || 'N/A'}`);
        console.log(`      Conversa: ${msg.conversation.contactName || msg.conversation.remoteJid}`);
        console.log(`      De mim: ${msg.fromMe ? 'Sim' : 'Não'}`);
        console.log('');
      });
    });

    // Verificar se há mensagens de mídia sem mediaUrl (problema)
    const messagesWithoutMediaUrl = mediaMessages.filter(m => !m.mediaUrl);
    if (messagesWithoutMediaUrl.length > 0) {
      console.log('🚨 PROBLEMA IDENTIFICADO:');
      console.log(`   ${messagesWithoutMediaUrl.length} mensagens de mídia não têm mediaUrl armazenada!`);
      console.log('   Isso significa que as mídias recebidas não estão sendo salvas localmente.');
      console.log('\n💡 POSSÍVEL CAUSA:');
      console.log('   O sistema apenas armazena a URL da mídia do WhatsApp/Evolution API,');
      console.log('   mas não faz download automático para armazenamento local.');
    }

    // Verificar se há mensagens de mídia enviadas vs recebidas
    const sentMedia = mediaMessages.filter(m => m.fromMe);
    const receivedMedia = mediaMessages.filter(m => !m.fromMe);

    console.log('\n📤📥 Distribuição Enviadas vs Recebidas:');
    console.log(`   Enviadas: ${sentMedia.length} mensagens`);
    console.log(`   Recebidas: ${receivedMedia.length} mensagens`);

    if (receivedMedia.length > 0) {
      const receivedWithUrl = receivedMedia.filter(m => m.mediaUrl).length;
      const receivedWithoutUrl = receivedMedia.filter(m => !m.mediaUrl).length;

      console.log(`   Recebidas com URL: ${receivedWithUrl}`);
      console.log(`   Recebidas sem URL: ${receivedWithoutUrl}`);
    }

  } catch (error) {
    console.error('❌ Erro ao analisar mensagens de mídia:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeMediaMessages();