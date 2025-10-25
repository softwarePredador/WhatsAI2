// Verificar números brasileiros relacionados aos mencionados pelo usuário
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkBrazilianNumbers() {
  try {
    console.log('🔍 Verificando números brasileiros no banco...');

    const allConversations = await prisma.conversation.findMany({
      select: {
        id: true,
        remoteJid: true,
        contactName: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`📊 Total de conversas: ${allConversations.length}`);

    // Filtrar apenas números brasileiros
    const brazilianConversations = allConversations.filter(conv =>
      conv.remoteJid.includes('@s.whatsapp.net') &&
      conv.remoteJid.startsWith('55')
    );

    console.log(`🇧🇷 Conversas brasileiras: ${brazilianConversations.length}`);

    // Analisar os números
    const numbers = brazilianConversations.map(conv => {
      const number = conv.remoteJid.replace('@s.whatsapp.net', '');
      const withoutCountry = number.substring(2); // Remove '55'

      return {
        fullNumber: number,
        withoutCountry: withoutCountry,
        ddd: withoutCountry.substring(0, 2),
        phone: withoutCountry.substring(2),
        length: withoutCountry.length,
        conversation: conv
      };
    });

    console.log('\n📞 Análise dos números brasileiros:');
    numbers.forEach(num => {
      console.log(`${num.fullNumber} | DDD: ${num.ddd} | Telefone: ${num.phone} | Tamanho: ${num.length} | Nome: ${num.conversation.contactName || 'N/A'}`);
    });

    // Procurar por números relacionados aos mencionados pelo usuário
    console.log('\n🎯 Procurando números relacionados a 99118898909 e 91188909:');

    // Hipótese 1: 99118898909 é DDD 99 + 11888909
    const hypothesis1 = numbers.filter(num =>
      num.ddd === '99' && num.phone.includes('11888909')
    );

    // Hipótese 2: 91188909 é DDD 91 + 11888909
    const hypothesis2 = numbers.filter(num =>
      num.ddd === '91' && num.phone.includes('11888909')
    );

    // Hipótese 3: 91188909 é 11 + 11888909 (sem 9º dígito)
    const hypothesis3 = numbers.filter(num =>
      num.ddd === '11' && num.phone.includes('11888909')
    );

    console.log(`Hipótese 1 (DDD 99): ${hypothesis1.length} encontros`);
    hypothesis1.forEach(h => console.log(`  - ${h.fullNumber}`));

    console.log(`Hipótese 2 (DDD 91): ${hypothesis2.length} encontros`);
    hypothesis2.forEach(h => console.log(`  - ${h.fullNumber}`));

    console.log(`Hipótese 3 (DDD 11): ${hypothesis3.length} encontros`);
    hypothesis3.forEach(h => console.log(`  - ${h.fullNumber}`));

    // Verificar se há números com mesmo telefone mas DDD diferente
    console.log('\n🔍 Verificando telefones iguais com DDDs diferentes:');
    const phoneGroups = {};
    numbers.forEach(num => {
      const key = num.phone;
      if (!phoneGroups[key]) phoneGroups[key] = [];
      phoneGroups[key].push(num);
    });

    Object.entries(phoneGroups).forEach(([phone, nums]) => {
      if (nums.length > 1) {
        console.log(`Telefone ${phone} aparece em ${nums.length} DDDs:`);
        nums.forEach(num => console.log(`  - ${num.fullNumber} (DDD ${num.ddd})`));
      }
    });

  } catch (error) {
    console.error('❌ Erro ao verificar números brasileiros:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBrazilianNumbers();