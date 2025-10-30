import { PrismaClient } from '@prisma/client';
import { IncomingMediaService } from './src/services/incoming-media-service';

const prisma = new PrismaClient();
const incomingMediaService = new IncomingMediaService();

async function reprocessUserMediaMessages() {
  console.log('🔄 Reprocessando mensagens de mídia enviadas pelo usuário...\n');

  try {
    // Buscar mensagens enviadas pelo usuário que têm mídia mas ainda usam URLs do WhatsApp
    const messagesToProcess = await prisma.message.findMany({
      where: {
        fromMe: true,
        AND: [
          { mediaUrl: { not: null } },
          { mediaUrl: { not: { contains: 'digitaloceanspaces.com' } } }
        ],
        messageType: {
          in: ['IMAGE', 'VIDEO', 'STICKER']
        }
      },
      include: {
        conversation: true
      }
    });

    console.log(`📸 Encontradas ${messagesToProcess.length} mensagens para reprocessar\n`);

    let processedCount = 0;
    let errorCount = 0;

    for (const message of messagesToProcess) {
      try {
        console.log(`🔄 Processando mensagem ${message.id} (${message.messageType})...`);

        // Preparar opções para o IncomingMediaService
        const mediaOptions = {
          messageId: message.id,
          mediaUrl: message.mediaUrl!,
          mediaType: message.messageType.toLowerCase() as 'image' | 'video' | 'sticker',
          fileName: message.fileName || undefined,
          caption: message.caption || undefined,
          mimeType: undefined // Não temos essa info histórica
        };

        // Processar a mídia
        const processedUrl = await incomingMediaService.processIncomingMedia(mediaOptions);

        if (processedUrl) {
          // Atualizar a mensagem com a nova URL
          await prisma.message.update({
            where: { id: message.id },
            data: { mediaUrl: processedUrl }
          });

          console.log(`✅ Sucesso: ${processedUrl.substring(0, 80)}...`);
          processedCount++;
        } else {
          console.log(`⚠️  Sem URL processada para ${message.id}`);
          errorCount++;
        }

      } catch (error) {
        console.error(`❌ Erro processando ${message.id}:`, error);
        errorCount++;
      }
    }

    console.log(`\n🎉 Reprocessamento concluído:`);
    console.log(`✅ ${processedCount} mensagens processadas com sucesso`);
    console.log(`❌ ${errorCount} mensagens com erro`);

  } catch (error) {
    console.error('❌ Erro geral:', error);
  } finally {
    await prisma.$disconnect();
  }
}

reprocessUserMediaMessages().catch(console.error);