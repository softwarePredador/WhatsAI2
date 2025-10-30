import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { IncomingMediaService } from './src/services/incoming-media-service';

const prisma = new PrismaClient();
const incomingMediaService = new IncomingMediaService();

async function reprocessMediaUploads() {
  console.log('🔄 Reprocessando uploads de mídia para DigitalOcean Spaces...');

  // Buscar mensagens que têm mediaUrl mas ainda apontam para WhatsApp (mmg.whatsapp.net)
  const messagesToReprocess = await prisma.message.findMany({
    where: {
      mediaUrl: {
        contains: 'mmg.whatsapp.net'
      },
      fromMe: false, // Apenas mensagens recebidas
      messageType: {
        in: ['IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT']
      }
    }
  });

  console.log(`📋 Encontradas ${messagesToReprocess.length} mensagens para reprocessar upload`);

  let successCount = 0;
  let errorCount = 0;

  for (const message of messagesToReprocess) {
    try {
      console.log(`📥 Reprocessando mensagem ${message.id} (${message.messageType})...`);

      // Preparar opções para o IncomingMediaService
      const mediaOptions = {
        messageId: message.id,
        mediaUrl: message.mediaUrl!,
        mediaType: message.messageType.toLowerCase() as 'image' | 'video' | 'audio' | 'document',
        fileName: message.fileName || undefined,
        caption: message.caption || undefined,
        mimeType: undefined // Não temos essa info salva
      };

      // Processar a mídia
      const processedUrl = await incomingMediaService.processIncomingMedia(mediaOptions);

      if (processedUrl) {
        // Atualizar a mensagem com a nova URL
        await prisma.message.update({
          where: { id: message.id },
          data: { mediaUrl: processedUrl }
        });

        console.log(`✅ Mensagem ${message.id}: upload concluído - ${processedUrl}`);
        successCount++;
      } else {
        console.log(`⚠️ Mensagem ${message.id}: processamento retornou null`);
        errorCount++;
      }

    } catch (error) {
      console.error(`❌ Erro ao reprocessar mensagem ${message.id}:`, error);
      errorCount++;
    }
  }

  console.log(`\n🎉 Reprocessamento concluído!`);
  console.log(`✅ Sucessos: ${successCount}`);
  console.log(`❌ Erros: ${errorCount}`);

  await prisma.$disconnect();
}

reprocessMediaUploads().catch(console.error);