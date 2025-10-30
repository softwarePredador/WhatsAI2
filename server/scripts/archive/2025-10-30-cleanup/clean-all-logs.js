const fs = require('fs');
const path = require('path');

// Processar conversation-service.ts
console.log('\n📁 Processando conversation-service.ts...');
let convPath = path.join(__dirname, 'src/services/conversation-service.ts');
let convContent = fs.readFileSync(convPath, 'utf8');
let convRemoved = 0;

// REMOVER logs verbosos, MANTER apenas errors críticos
const convPatternsToRemove = [
  // Logs de WebSocket emit (verbosos - já tem log no socket-service)
  /\s*console\.log\(`📡 \[CONTACT_UPDATE\] Emitindo.*?\n.*?\n.*?\n.*?\);?\n/gs,
  /\s*console\.log\(`📡 \[handleIncomingMessage\] Emitindo.*?\n.*?\n.*?\n.*?\);?\n/gs,
  
  // Logs de status update (verbosos)
  /\s*console\.log\('📬 \[handleMessageStatusUpdate\].*?\);?\n/g,
  /\s*console\.log\('⚠️ Message.*?not found.*?\);?\n/g,
  /\s*console\.log\('⚠️ Invalid status:.*?\);?\n/g,
];

convPatternsToRemove.forEach(pattern => {
  const matches = convContent.match(pattern);
  if (matches) {
    convRemoved += matches.length;
    convContent = convContent.replace(pattern, '');
  }
});

// MANTER console.error (são erros críticos)

convContent = convContent.replace(/\n{3,}/g, '\n\n');
fs.writeFileSync(convPath, convContent, 'utf8');
console.log(`✅ conversation-service.ts: ${convRemoved} logs verbosos removidos`);
console.log(`   ✅ Mantidos: ${(convContent.match(/console\.error/g) || []).length} console.error críticos`);

// Processar webhook-controller.ts
console.log('\n📁 Processando webhook-controller.ts...');
let webhookPath = path.join(__dirname, 'src/api/controllers/webhook-controller.ts');
let webhookContent = fs.readFileSync(webhookPath, 'utf8');
let webhookRemoved = 0;

// REMOVER logs verbosos do webhook (executam em CADA evento)
const webhookPatternsToRemove = [
  // Banner de debug (executam sempre)
  /\s*console\.log\(`🚨 \[WEBHOOK\] ={38,}`\);?\n/g,
  /\s*console\.log\(`🚨 \[WEBHOOK\] Requisição chegou!.*?\);?\n/g,
  /\s*console\.log\(`🚨 \[WEBHOOK\] Content-Type:.*?\);?\n/g,
  /\s*console\.log\(`🚨 \[WEBHOOK\] Body type:.*?\);?\n/g,
  /\s*console\.log\(`🚨 \[WEBHOOK\] Body:.*?\);?\n/g,
  /\s*console\.log\(`🚨 \[WEBHOOK\] Parsed buffer.*?\);?\n/g,
  /\s*console\.log\(`🚨 \[WEBHOOK\] Buffer is not JSON.*?\);?\n/g,
  /\s*console\.log\(`🚨 \[WEBHOOK\] instanceId do params:.*?\);?\n/g,
  
  // Logs de validação (verbosos)
  /\s*console\.log\(`✅ \[WEBHOOK_VALIDATION\] Schema específico.*?\);?\n/g,
  /\s*console\.log\(`⚠️ \[WEBHOOK_VALIDATION\] Schema específico falhou.*?\);?\n/g,
  /\s*console\.log\(`✅ \[WEBHOOK_VALIDATION\] Schema genérico.*?\);?\n/g,
  
  // Logs de evento recebido (verbosos)
  /\s*console\.log\(`🔍 \[WEBHOOK\] Evento recebido:.*?\);?\n/g,
  /\s*console\.log\(`🔍 \[WEBHOOK\] Dados do webhook:.*?\);?\n/g,
  
  // Logs de instance found (verbosos)
  /\s*console\.log\(`✅ \[WEBHOOK\] Instance found:.*?\);?\n/g,
  /\s*console\.log\(`⚠️ \[WEBHOOK\] Instance.*?not found.*?\);?\n/g,
  
  // Logs de webhook file (verbosos - arquivo cresce infinitamente)
  /\s*console\.log\(`📝 \[LOG_WEBHOOK\] Iniciando log.*?\);?\n/g,
  /\s*console\.log\(`📝 \[WEBHOOK LOG\] Saved webhook.*?\);?\n/g,
  
  // Warning de raw data (não é erro crítico)
  /\s*console\.log\(`⚠️ \[WEBHOOK\] Received raw data.*?\);?\n/g,
  /\s*console\.log\(`❌ \[WEBHOOK\] instanceId não fornecido.*?\);?\n/g,
];

webhookPatternsToRemove.forEach(pattern => {
  const matches = webhookContent.match(pattern);
  if (matches) {
    webhookRemoved += matches.length;
    webhookContent = webhookContent.replace(pattern, '');
  }
});

// MANTER console.error (são erros críticos)

webhookContent = webhookContent.replace(/\n{3,}/g, '\n\n');
fs.writeFileSync(webhookPath, webhookContent, 'utf8');
console.log(`✅ webhook-controller.ts: ${webhookRemoved} logs verbosos removidos`);
console.log(`   ✅ Mantidos: ${(webhookContent.match(/console\.error/g) || []).length} console.error críticos`);

// Resumo
const totalRemoved = convRemoved + webhookRemoved;
console.log(`\n🎯 RESUMO FINAL:`);
console.log(`   📊 Total removido: ${totalRemoved} logs verbosos`);
console.log(`   💡 Ganho estimado: ~${totalRemoved * 2}ms por request`);
console.log(`   ✅ Errors críticos mantidos para debugging`);
