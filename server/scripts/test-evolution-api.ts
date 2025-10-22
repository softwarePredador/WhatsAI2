import axios from 'axios';

const EVOLUTION_API_URL = 'https://hsapi.studio/';
const EVOLUTION_API_KEY = 'Pz6qEerZE5IYwaoc8ZCQxmBdLAinX4dl';

async function testEvolutionAPI() {
  console.log('🔍 Testing Evolution API Connection...');
  console.log(`📡 URL: ${EVOLUTION_API_URL}`);
  console.log(`🔑 API Key: ${EVOLUTION_API_KEY.substring(0, 8)}...`);
  
  const client = axios.create({
    baseURL: EVOLUTION_API_URL,
    headers: {
      'Content-Type': 'application/json',
      'apikey': EVOLUTION_API_KEY
    },
    timeout: 30000
  });

  try {
    // Test 1: Check server status
    console.log('\n📊 Test 1: Server Status');
    const healthResponse = await client.get('/');
    console.log('✅ Server is responding:', healthResponse.status);
    
    // Test 2: List existing instances
    console.log('\n📱 Test 2: List Instances');
    try {
      const instancesResponse = await client.get('/instance/fetchInstances');
      console.log('✅ Instances endpoint accessible');
      console.log(`📋 Found ${instancesResponse.data?.length || 0} existing instances`);
      
      if (instancesResponse.data?.length > 0) {
        console.log('🔍 Existing instances:');
        instancesResponse.data.forEach((instance: any, index: number) => {
          console.log(`   ${index + 1}. ${instance.instance?.instanceName || 'Unknown'} - ${instance.instance?.state || 'Unknown'}`);
        });
      }
    } catch (error: any) {
      console.log('⚠️  Instances endpoint error:', error.response?.status, error.response?.statusText);
    }

    // Test 3: Test instance creation (dry run)
    console.log('\n🧪 Test 3: Test Instance Creation Endpoint');
    const testInstanceName = `whatsai_test_${Date.now()}`;
    
    try {
      const createResponse = await client.post('/instance/create', {
        instanceName: testInstanceName,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS',
        webhook: '',
        webhookByEvents: false,
        webhookBase64: false,
        events: [
          'APPLICATION_STARTUP',
          'QRCODE_UPDATED',
          'MESSAGES_UPSERT',
          'CONNECTION_UPDATE'
        ]
      });
      
      console.log('✅ Instance creation successful!');
      console.log('📱 Instance created:', createResponse.data);
      
      // Clean up - delete the test instance
      try {
        await client.delete(`/instance/delete/${testInstanceName}`);
        console.log('🧹 Test instance cleaned up');
      } catch (cleanupError) {
        console.log('⚠️  Cleanup warning (instance may not exist)');
      }
      
    } catch (error: any) {
      console.log('❌ Instance creation failed:', error.response?.status, error.response?.data);
    }

  } catch (error: any) {
    console.error('❌ Evolution API Test Failed:');
    console.error('   Status:', error.response?.status);
    console.error('   Message:', error.response?.statusText);
    console.error('   Data:', error.response?.data);
    
    if (error.code === 'ENOTFOUND') {
      console.error('🌐 Network Error: Cannot reach the server. Check URL and internet connection.');
    } else if (error.response?.status === 401) {
      console.error('🔑 Authentication Error: Invalid API key.');
    } else if (error.response?.status === 403) {
      console.error('🚫 Authorization Error: API key does not have required permissions.');
    }
  }
}

// Run the test
testEvolutionAPI().then(() => {
  console.log('\n🎯 Evolution API test completed!');
}).catch(error => {
  console.error('💥 Test script error:', error);
});