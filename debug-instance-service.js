// Debug script para testar nosso serviço de instâncias
const { WhatsAppInstanceService } = require('./server/src/services/instance-service');

async function testInstanceService() {
  try {
    console.log('🔍 Testando WhatsAppInstanceService...');
    
    const instanceService = new WhatsAppInstanceService();
    
    console.log('📋 Buscando todas as instâncias...');
    const instances = await instanceService.getAllInstances();
    
    console.log(`📱 Encontradas ${instances.length} instâncias:`);
    instances.forEach(instance => {
      console.log(`- ${instance.name} (${instance.status})`);
      console.log(`  QR Code: ${instance.qrCode ? 'SIM ✅' : 'NÃO ❌'}`);
      console.log(`  Evolution Name: ${instance.evolutionInstanceName}`);
    });
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    console.error(error.stack);
  }
}

testInstanceService();