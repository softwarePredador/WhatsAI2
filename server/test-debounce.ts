import { debounceService } from './src/services/debounce-service';

async function testDebounceService() {
  console.log('🧪 Testing Debounce/Throttle Service...\n');

  // Inicializar serviço
  debounceService.initialize();

  // Test 1: Presence Update Debounce
  console.log('--- Test 1: Presence Update Debounce (2s) ---');
  console.log('Simulando 10 eventos presence.update em rápida sucessão...\n');

  const contactId = '5541999999999@s.whatsapp.net';
  const events = ['composing', 'composing', 'composing', 'available', 'composing', 'available', 'available', 'composing', 'available', 'unavailable'];

  let processedCount = 0;
  const processPresence = debounceService.debouncePresenceUpdate(
    (data: { status: string; timestamp: number }) => {
      processedCount++;
      console.log(`✅ PROCESSED: status=${data.status}, elapsed=${Date.now() - data.timestamp}ms`);
    },
    contactId
  );

  // Envia todos os eventos rapidamente
  events.forEach((status, index) => {
    setTimeout(() => {
      console.log(`📨 Event ${index + 1}: ${status}`);
      processPresence({ status, timestamp: Date.now() });
    }, index * 100); // 100ms entre eventos
  });

  // Aguarda debounce completar (2s + margem)
  await new Promise(resolve => setTimeout(resolve, 3500));

  console.log(`\n📊 Resultado: ${events.length} eventos enviados, ${processedCount} processados`);
  console.log(`💡 Economia: ${events.length - processedCount} chamadas evitadas (${Math.round(((events.length - processedCount) / events.length) * 100)}%)\n`);

  // Test 2: Chat Upsert Throttle
  console.log('--- Test 2: Chat Upsert Throttle (1s) ---');
  console.log('Simulando 15 eventos chats.upsert em rápida sucessão...\n');

  const instanceId = 'test-instance-123';
  let throttledProcessedCount = 0;
  
  const processChat = debounceService.throttleChatUpsert(
    (data: { count: number; timestamp: number }) => {
      throttledProcessedCount++;
      console.log(`✅ PROCESSED: event #${data.count}, elapsed=${Date.now() - data.timestamp}ms`);
    },
    instanceId
  );

  // Envia 15 eventos rapidamente (150ms intervalo)
  for (let i = 1; i <= 15; i++) {
    setTimeout(() => {
      console.log(`📨 Event ${i}`);
      processChat({ count: i, timestamp: Date.now() });
    }, i * 150);
  }

  // Aguarda throttle completar
  await new Promise(resolve => setTimeout(resolve, 4000));

  console.log(`\n📊 Resultado: 15 eventos enviados, ${throttledProcessedCount} processados`);
  console.log(`💡 Economia: ${15 - throttledProcessedCount} chamadas evitadas (${Math.round(((15 - throttledProcessedCount) / 15) * 100)}%)\n`);

  // Test 3: Estatísticas Gerais
  console.log('--- Test 3: Estatísticas Gerais ---');
  const stats = debounceService.getStats();
  
  console.log('\n📈 Debounce/Throttle Stats:');
  stats.forEach(stat => {
    console.log(`\n${stat.eventType}:`);
    console.log(`  Total Calls: ${stat.totalCalls}`);
    console.log(`  Processed: ${stat.processedCalls}`);
    console.log(`  Skipped: ${stat.skippedCalls}`);
    console.log(`  Skip Rate: ${stat.skipRate}%`);
  });

  console.log('\n✅ All tests completed!');
}

testDebounceService().catch(console.error);
