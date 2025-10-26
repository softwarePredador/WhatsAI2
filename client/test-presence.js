// Teste simples para verificar se o status de presença está funcionando
// Execute este script no console do navegador quando estiver na página do chat

// Simular um evento de presence.update
const simulatePresenceUpdate = (contactId, status) => {
  console.log(`🧪 [TEST] Simulando presence.update para ${contactId}: ${status}`);

  // Criar dados de teste
  const testData = {
    contactId: contactId,
    status: status,
    isTyping: status === 'composing',
    isOnline: status === 'available'
  };

  // Emitir evento via socket (se disponível)
  if (window.socketService) {
    window.socketService.emit('presence:update', testData);
    console.log('✅ [TEST] Evento emitido via socketService');
  } else {
    console.log('❌ [TEST] socketService não encontrado');
  }
};

// Testes
console.log('🧪 Iniciando testes de presença...');

// Teste 1: Contato online
simulatePresenceUpdate('5511999999999@s.whatsapp.net', 'available');

// Teste 2: Contato offline
setTimeout(() => {
  simulatePresenceUpdate('5511999999999@s.whatsapp.net', 'unavailable');
}, 2000);

// Teste 3: Contato digitando
setTimeout(() => {
  simulatePresenceUpdate('5511999999999@s.whatsapp.net', 'composing');
}, 4000);

console.log('🧪 Testes agendados. Verifique se o status na UI muda.');