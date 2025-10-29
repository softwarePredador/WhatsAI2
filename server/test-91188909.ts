/**
 * Test específico para número 91188909
 */

import { normalizeWhatsAppJid } from './src/utils/phone-helper';

console.log('🧪 Testando número 91188909\n');
console.log('='.repeat(60));

const testCases = [
  '91188909',
  '41991188909',
  '5541991188909',
  '+5541991188909',
  '554191188909', // 12 dígitos (sem o 9 do celular)
  '5541991188909@s.whatsapp.net',
  '554191188909@s.whatsapp.net'
];

testCases.forEach(input => {
  const result = normalizeWhatsAppJid(input);
  console.log(`Input:  ${input.padEnd(35)} → ${result}`);
});

console.log('\n' + '='.repeat(60));
console.log('\n✅ Testes concluídos!\n');
