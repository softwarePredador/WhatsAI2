import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixBrazilianNumbers() {
  console.log('🇧🇷 Corrigindo números brasileiros sem o 9...\n');

  // Buscar todas as conversas com números BR (começam com 55)
  const allConversations = await prisma.conversation.findMany({
    where: {
      remoteJid: {
        startsWith: '55'
      }
    },
    include: {
      messages: true
    }
  });

  console.log(`📊 Encontradas ${allConversations.length} conversas brasileiras\n`);

  const fixed = [];

  for (const conv of allConversations) {
    const cleanNumber = conv.remoteJid.replace('@s.whatsapp.net', '');
    
    // Número BR sem país: 2 dígitos DDD + número
    const withoutCountry = cleanNumber.substring(2);
    
    // Se tem 10 dígitos (formato antigo sem o 9)
    if (withoutCountry.length === 10) {
      const ddd = withoutCountry.substring(0, 2);
      const numero = withoutCountry.substring(2);
      const correctNumber = `55${ddd}9${numero}@s.whatsapp.net`;
      
      console.log(`🔧 Número antigo encontrado:`);
      console.log(`   Atual: ${conv.remoteJid}`);
      console.log(`   Correto: ${correctNumber}`);
      console.log(`   Mensagens: ${conv.messages.length}`);
      
      // Verificar se já existe conversa com o número correto
      const existingCorrect = await prisma.conversation.findFirst({
        where: {
          instanceId: conv.instanceId,
          remoteJid: correctNumber
        },
        include: {
          messages: true
        }
      });

      if (existingCorrect) {
        console.log(`   ✅ Conversa correta já existe (${existingCorrect.messages.length} mensagens)`);
        console.log(`   🔄 Mesclando...`);
        
        // Mover mensagens da conversa errada para a correta
        if (conv.messages.length > 0) {
          await prisma.message.updateMany({
            where: { conversationId: conv.id },
            data: { 
              conversationId: existingCorrect.id,
              remoteJid: correctNumber
            }
          });
          console.log(`   📦 ${conv.messages.length} mensagens movidas`);
        }
        
        // Atualizar lastMessage se necessário
        if (conv.lastMessageAt && existingCorrect.lastMessageAt) {
          if (conv.lastMessageAt > existingCorrect.lastMessageAt) {
            await prisma.conversation.update({
              where: { id: existingCorrect.id },
              data: {
                lastMessage: conv.lastMessage,
                lastMessageAt: conv.lastMessageAt
              }
            });
            console.log(`   📝 lastMessage atualizado`);
          }
        }
        
        // Deletar conversa antiga
        await prisma.conversation.delete({
          where: { id: conv.id }
        });
        console.log(`   🗑️  Conversa antiga deletada`);
        
      } else {
        console.log(`   ✅ Nenhuma conversa correta encontrada, atualizando...`);
        
        // Atualizar o número diretamente
        await prisma.conversation.update({
          where: { id: conv.id },
          data: { remoteJid: correctNumber }
        });
        
        // Atualizar mensagens também
        await prisma.message.updateMany({
          where: { conversationId: conv.id },
          data: { remoteJid: correctNumber }
        });
        
        console.log(`   ✅ Número atualizado!`);
      }
      
      fixed.push(conv.remoteJid);
      console.log('');
    }
  }

  if (fixed.length === 0) {
    console.log('✅ Nenhum número antigo encontrado!');
  } else {
    console.log(`\n🎉 ${fixed.length} números corrigidos!`);
  }

  await prisma.$disconnect();
}

fixBrazilianNumbers();
