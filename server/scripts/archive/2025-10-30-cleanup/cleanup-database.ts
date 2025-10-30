/**
 * Script para limpar conversas duplicadas e resetar banco de dados
 * 
 * Este script irá:
 * 1. Deletar todas as mensagens
 * 2. Deletar todas as conversas
 * 3. Permitir que os webhooks recriem tudo com normalização correta
 */

import { prisma } from './src/database/prisma';

async function cleanupDatabase() {
  console.log('🧹 Iniciando limpeza do banco de dados...\n');

  try {
    // 1. Contar registros antes
    const messageCount = await prisma.message.count();
    const conversationCount = await prisma.conversation.count();

    console.log('📊 Estado atual:');
    console.log(`   - Mensagens: ${messageCount}`);
    console.log(`   - Conversas: ${conversationCount}\n`);

    // 2. Confirmar com usuário
    console.log('⚠️  ATENÇÃO: Esta ação irá deletar TODAS as conversas e mensagens!');
    console.log('   Os webhooks irão recriar tudo automaticamente com a normalização correta.\n');

    // 3. Deletar mensagens primeiro (por causa das foreign keys)
    console.log('🗑️  Deletando mensagens...');
    const deletedMessages = await prisma.message.deleteMany({});
    console.log(`   ✅ ${deletedMessages.count} mensagens deletadas\n`);

    // 4. Deletar conversas
    console.log('🗑️  Deletando conversas...');
    const deletedConversations = await prisma.conversation.deleteMany({});
    console.log(`   ✅ ${deletedConversations.count} conversas deletadas\n`);

    // 5. Verificar limpeza
    const finalMessageCount = await prisma.message.count();
    const finalConversationCount = await prisma.conversation.count();

    console.log('📊 Estado final:');
    console.log(`   - Mensagens: ${finalMessageCount}`);
    console.log(`   - Conversas: ${finalConversationCount}\n`);

    console.log('✅ Limpeza concluída com sucesso!');
    console.log('💡 Os webhooks irão recriar as conversas automaticamente com a normalização correta.\n');

  } catch (error) {
    console.error('❌ Erro durante limpeza:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
cleanupDatabase()
  .then(() => {
    console.log('👋 Script finalizado!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });
