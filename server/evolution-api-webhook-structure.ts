/**
 * Buscar na documentação Evolution API v2.3 sobre estrutura de webhooks
 * Especialmente sobre campos participant, participantAlt, remoteJid, remoteJidAlt
 */

// Baseado na documentação Postman: https://www.postman.com/agenciadgcode/evolution-api/documentation/nm0wqgt/evolution-api-v2-3

// ESTRUTURA CONHECIDA DO WEBHOOK messages.upsert:
const webhookStructureKnown = {
  event: 'messages.upsert',
  instance: 'instance-name',
  data: {
    key: {
      remoteJid: 'string',      // ✅ CONFIRMADO
      fromMe: 'boolean',        // ✅ CONFIRMADO
      id: 'string',             // ✅ CONFIRMADO
      participant: 'string?',   // ✅ CONFIRMADO (grupos)
      
      // ❓ DÚVIDA: Esses campos existem na Evolution API?
      participantAlt: 'string?',   // Baileys v7 deveria fornecer
      remoteJidAlt: 'string?'      // Baileys v7 deveria fornecer
    },
    message: {
      // ... conteúdo da mensagem
    },
    messageType: 'string',
    messageTimestamp: 'number',
    pushName: 'string'
  }
};

console.log('📚 ESTRUTURA DE WEBHOOK CONHECIDA:\n');
console.log(JSON.stringify(webhookStructureKnown, null, 2));

console.log('\n\n🔍 CAMPOS A INVESTIGAR:\n');
console.log('1. participantAlt - Deveria conter número real quando participant é @lid');
console.log('2. remoteJidAlt - Deveria conter número real quando remoteJid é @lid');
console.log('\n🎯 COMO DESCOBRIR:');
console.log('- Aguardar webhook real de mensagem com @lid');
console.log('- Verificar tabela webhook_logs no banco');
console.log('- Executar: npx tsx analyze-webhook-logs.ts');
