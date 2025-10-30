import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function reprocessOldMediaMessages() {
  console.log('🔄 Reprocessando mensagens antigas de mídia...');

  // Buscar mensagens que ainda têm conteúdo de placeholder
  const messagesToUpdate = await prisma.message.findMany({
    where: {
      OR: [
        { content: '[Mensagem não suportada]' },
        { content: '[Imagem]' },
        { content: '[Vídeo]' },
        { content: '[Áudio]' },
        { content: '[Documento: arquivo]' },
        { content: '[Sticker]' },
        { content: '[Localização]' },
        { content: '[Contato]' }
      ],
      mediaUrl: { not: null }
    }
  });

  console.log(`📋 Encontradas ${messagesToUpdate.length} mensagens para reprocessar`);

  let updatedCount = 0;

  for (const message of messagesToUpdate) {
    try {
      // Determinar o novo content baseado no messageType
      let newContent = '';

      if (message.messageType === 'IMAGE' || message.messageType === 'VIDEO') {
        // Para imagem e vídeo, manter apenas o caption se existir
        newContent = message.caption || '';
      } else if (message.messageType === 'DOCUMENT') {
        // Para documentos, mostrar apenas o nome do arquivo
        newContent = message.fileName || '';
      }
      // Para outros tipos (AUDIO, STICKER, LOCATION, CONTACT), deixar vazio

      // Atualizar a mensagem
      await prisma.message.update({
        where: { id: message.id },
        data: { content: newContent }
      });

      updatedCount++;
      console.log(`✅ Mensagem ${message.id}: "${message.content}" → "${newContent}"`);

    } catch (error) {
      console.error(`❌ Erro ao atualizar mensagem ${message.id}:`, error);
    }
  }

  console.log(`\n🎉 Reprocessamento concluído! ${updatedCount} mensagens atualizadas.`);
  await prisma.$disconnect();
}

reprocessOldMediaMessages().catch(console.error);