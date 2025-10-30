/**
 * Script para detectar e unificar conversas duplicadas usando contactPicture
 * A foto de perfil é a mesma para @lid e número real da mesma pessoa
 */

import { findDuplicatesByPicture, mergeConversations } from './src/utils/conversation-merger';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 DETECÇÃO E UNIFICAÇÃO DE DUPLICATAS POR FOTO DE PERFIL\n');

  // 1. Listar todas as instâncias
  const instances = await prisma.whatsAppInstance.findMany({
    select: { id: true, name: true, evolutionInstanceName: true }
  });

  console.log(`📱 Instâncias encontradas: ${instances.length}\n`);

  let totalDuplicates = 0;
  let totalMerged = 0;

  // 2. Para cada instância, buscar duplicatas
  for (const instance of instances) {
    console.log(`\n🔍 Processando instância: ${instance.name}`);
    console.log(`   ID: ${instance.id}`);

    const duplicates = await findDuplicatesByPicture(instance.id);
    
    if (duplicates.length === 0) {
      console.log(`   ✅ Nenhuma duplicata encontrada`);
      continue;
    }

    totalDuplicates += duplicates.length;

    // 3. Perguntar se quer unificar (modo interativo pode ser adicionado depois)
    console.log(`\n🔀 Encontradas ${duplicates.length} duplicatas. Unificando...`);

    for (const dup of duplicates) {
      try {
        console.log(`\n📋 Duplicata:`);
        console.log(`   Nome: ${dup.lidConversation.contactName || dup.realConversation.contactName}`);
        console.log(`   @lid: ${dup.lidConversation.remoteJid} (${dup.lidConversation._count.messages} msgs)`);
        console.log(`   Real: ${dup.realConversation.remoteJid} (${dup.realConversation._count.messages} msgs)`);

        const result = await mergeConversations(
          dup.lidConversation.remoteJid,
          dup.realConversation.remoteJid
        );

        console.log(`   ✅ Unificação concluída: ${result.messagesMigrated} mensagens migradas`);
        totalMerged++;

      } catch (error) {
        console.error(`   ❌ Erro ao unificar:`, error);
      }
    }
  }

  console.log(`\n\n📊 RESUMO FINAL:`);
  console.log(`   Total de duplicatas encontradas: ${totalDuplicates}`);
  console.log(`   Total de unificações realizadas: ${totalMerged}`);
  console.log(`   Sucesso: ${totalMerged}/${totalDuplicates}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
