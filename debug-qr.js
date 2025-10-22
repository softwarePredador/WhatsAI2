// Debug script para testar QR Code diretamente
const axios = require('axios');

async function testQRCode() {
  try {
    console.log('🔍 Testando Evolution API diretamente...');
    
    const response = await axios.get(
      'https://hsapi.studio/instance/connect/whatsai_8403b3f8_f4c6_447c_8fff_f84c8d15d8cb',
      {
        headers: {
          'apikey': 'Pz6qEerZE5IYwaoc8ZCQxmBdLAinX4dl'
        }
      }
    );
    
    console.log('✅ Resposta da Evolution API:');
    console.log('Status:', response.status);
    console.log('Headers:', response.headers['content-type']);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    
    if (response.data && response.data.base64) {
      console.log('✅ QR Code encontrado!');
      console.log('Tamanho:', response.data.base64.length);
      console.log('Início:', response.data.base64.substring(0, 50));
    } else {
      console.log('❌ QR Code não encontrado na resposta');
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar Evolution API:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testQRCode();