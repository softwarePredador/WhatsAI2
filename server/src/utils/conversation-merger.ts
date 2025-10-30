/**
 * Utilitário para unificar conversas duplicadas (@lid + número real da mesma pessoa)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface MergeResult {
  success: boolean;
  keptConversationId: string;
  removedConversationId: string;
  messagesMigrated: number;
}

interface DuplicateMatch {
  lidConversation: any;
  realConversation: any;
  matchReason: string;
}

/**
 * Detecta conversas duplicadas usando contactPicture como identificador
 * A foto de perfil é a mesma independente de @lid ou número real
 */
export async function findDuplicatesByPicture(instanceId: string): Promise<DuplicateMatch[]> {
  console.log(`🔍 [DUPLICATE_DETECTION] Buscando duplicatas por foto de perfil...`);

  // Buscar conversas com @lid que tenham foto
  const lidConversations = await prisma.conversation.findMany({
    where: {
      instanceId: instanceId,
      remoteJid: { contains: '@lid' },
      contactPicture: { not: null }
    },
    select: {
      id: true,
      remoteJid: true,
      contactName: true,
      contactPicture: true,
      _count: { select: { messages: true } }
    }
  });

  console.log(`   Encontradas ${lidConversations.length} conversas @lid com foto`);

  const duplicates: DuplicateMatch[] = [];

  // Para cada conversa @lid, buscar conversa com número real que tenha a mesma foto
  for (const lidConv of lidConversations) {
    const realConv = await prisma.conversation.findFirst({
      where: {
        instanceId: instanceId,
        remoteJid: { 
          contains: '@s.whatsapp.net',
          not: { contains: '@lid' }
        },
        contactPicture: lidConv.contactPicture,
        id: { not: lidConv.id } // Não pode ser a mesma conversa
      },
      select: {
        id: true,
        remoteJid: true,
        contactName: true,
        contactPicture: true,
        _count: { select: { messages: true } }
      }
    });

    if (realConv) {
      console.log(`✅ [DUPLICATE_FOUND] Match encontrado!`);
      console.log(`   @lid: ${lidConv.remoteJid} (${lidConv._count.messages} msgs)`);
      console.log(`   Real: ${realConv.remoteJid} (${realConv._count.messages} msgs)`);
      console.log(`   Foto: ${lidConv.contactPicture?.substring(0, 50)}...`);

      duplicates.push({
        lidConversation: lidConv,
        realConversation: realConv,
        matchReason: 'same_profile_picture'
      });
    }
  }

  console.log(`\n📊 [DUPLICATE_DETECTION] Total de duplicatas encontradas: ${duplicates.length}`);
  
  return duplicates;
}

/**
 * Unifica duas conversas da mesma pessoa (@lid e número real)
 * Migra todas as mensagens da conversa @lid para a conversa com número real
 */
export async function mergeConversations(
  lidRemoteJid: string,
  realNumberRemoteJid: string
): Promise<MergeResult> {
  
  console.log(`🔀 [MERGE] Iniciando merge de conversas:`);
  console.log(`   @lid: ${lidRemoteJid}`);
  console.log(`   Real: ${realNumberRemoteJid}`);

  // Buscar ambas conversas
  const lidConv = await prisma.conversation.findFirst({
    where: { remoteJid: lidRemoteJid },
    include: { messages: true }
  });

  const realConv = await prisma.conversation.findFirst({
    where: { remoteJid: realNumberRemoteJid },
    include: { messages: true }
  });

  if (!lidConv || !realConv) {
    console.error(`❌ [MERGE] Uma ou ambas conversas não encontradas`);
    throw new Error('Conversas não encontradas');
  }

  console.log(`📊 [MERGE] Estatísticas:`);
  console.log(`   @lid: ${lidConv.messages.length} mensagens`);
  console.log(`   Real: ${realConv.messages.length} mensagens`);

  // Decidir qual manter (preferir a com número real)
  const keepConv = realConv;
  const removeConv = lidConv;

  // Migrar mensagens em transação
  const result = await prisma.$transaction(async (tx) => {
    // 1. Migrar todas as mensagens da conversa @lid para a real
    const updateResult = await tx.message.updateMany({
      where: { conversationId: removeConv.id },
      data: { 
        conversationId: keepConv.id,
        remoteJid: realNumberRemoteJid // Atualizar também o remoteJid
      }
    });

    console.log(`✅ [MERGE] ${updateResult.count} mensagens migradas`);

    // 2. Atualizar metadados da conversa mantida
    await tx.conversation.update({
      where: { id: keepConv.id },
      data: {
        // Se a conversa @lid tem nome e a real não, copiar
        contactName: keepConv.contactName || removeConv.contactName,
        contactPicture: keepConv.contactPicture || removeConv.contactPicture,
        // Manter a data da última mensagem mais recente
        lastMessageAt: 
          (keepConv.lastMessageAt && removeConv.lastMessageAt && keepConv.lastMessageAt > removeConv.lastMessageAt) 
            ? keepConv.lastMessageAt 
            : removeConv.lastMessageAt,
        // Somar contadores
        unreadCount: keepConv.unreadCount + removeConv.unreadCount
      }
    });

    // 3. Deletar a conversa @lid (agora vazia)
    await tx.conversation.delete({
      where: { id: removeConv.id }
    });

    console.log(`🗑️ [MERGE] Conversa @lid removida`);

    return {
      success: true,
      keptConversationId: keepConv.id,
      removedConversationId: removeConv.id,
      messagesMigrated: updateResult.count
    };
  });

  console.log(`✨ [MERGE] Unificação concluída com sucesso!`);
  
  return result;
}

/**
 * Busca e unifica automaticamente conversas duplicadas
 */
export async function findAndMergeDuplicates(): Promise<MergeResult[]> {
  console.log(`🔍 [AUTO_MERGE] Buscando conversas duplicadas...`);

  const allConversations = await prisma.conversation.findMany({
    select: { remoteJid: true, contactName: true }
  });

  const lidConversations = allConversations.filter(c => c.remoteJid.includes('@lid'));
  const realConversations = allConversations.filter(c => c.remoteJid.includes('@s.whatsapp.net'));

  console.log(`📊 [AUTO_MERGE] ${lidConversations.length} conversas @lid, ${realConversations.length} reais`);

  const merges: MergeResult[] = [];

  // TODO: Implementar lógica de detecção de duplicatas
  // Por enquanto, precisa ser manual via mergeConversations()

  return merges;
}
