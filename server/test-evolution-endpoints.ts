import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Testa diferentes endpoints da Evolution API para download de mídia
 */

async function testEndpoints() {
  const evolutionApiUrl = process.env.EVOLUTION_API_URL || 'https://hsapi.studio';
  const evolutionApiKey = process.env.EVOLUTION_API_KEY || '717376BB-0133-4A66-8994-BCA8A6F039D9';
  const instanceName = 'whatsai_6b7ac205_fee4_4da5_bebe_bcf0c552e795';

  // Carregar dados do webhook
  const webhookLogsPath = path.join(__dirname, 'webhook-logs.txt');
  const webhookContent = fs.readFileSync(webhookLogsPath, 'utf-8');
  const jsonMatch = webhookContent.match(/=== WEBHOOK DATA ===\s*(\{[\s\S]*?\n\})\n===/);
  if (!jsonMatch) {
    throw new Error('Webhook data not found');
  }
  const webhookData = JSON.parse(jsonMatch[1]);
  const messageData = webhookData.data;
  const messageKey = messageData.key;

  console.log('🔍 Testando endpoints da Evolution API...\n');
  console.log(`🌐 URL Base: ${evolutionApiUrl}`);
  console.log(`📱 Instance: ${instanceName}`);
  console.log(`📝 Message ID: ${messageKey.id}\n`);

  // Lista de endpoints possíveis para testar
  const endpoints = [
    {
      name: 'POST /message/downloadMedia/:instance',
      method: 'POST',
      url: `/message/downloadMedia/${instanceName}`,
      data: { message: messageData }
    },
    {
      name: 'POST /chat/getBase64FromMediaMessage',
      method: 'POST',
      url: '/chat/getBase64FromMediaMessage',
      data: {
        instance: instanceName,
        message: messageData
      }
    },
    {
      name: 'POST /chat/getBase64FromMediaMessage (v2)',
      method: 'POST',
      url: `/chat/getBase64FromMediaMessage/${instanceName}`,
      data: { message: messageData }
    },
    {
      name: 'POST /message/media/:instance',
      method: 'POST',
      url: `/message/media/${instanceName}`,
      data: { key: messageKey }
    },
    {
      name: 'GET /message/media/:instance/:messageId',
      method: 'GET',
      url: `/message/media/${instanceName}/${messageKey.id}`,
      data: null
    },
    {
      name: 'POST /chat/fetchMediaMessage',
      method: 'POST',
      url: `/chat/fetchMediaMessage/${instanceName}`,
      data: {
        key: messageKey,
        message: messageData.message
      }
    }
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`\n🚀 Testando: ${endpoint.name}`);
      console.log(`   Método: ${endpoint.method}`);
      console.log(`   URL: ${endpoint.url}`);

      const config: any = {
        method: endpoint.method,
        url: `${evolutionApiUrl}${endpoint.url}`,
        headers: {
          'apikey': evolutionApiKey,
          'Content-Type': 'application/json'
        },
        timeout: 10000,
        validateStatus: () => true // Aceitar qualquer status para análise
      };

      if (endpoint.data && endpoint.method === 'POST') {
        config.data = endpoint.data;
      }

      const response = await axios(config);

      console.log(`   ✅ Status: ${response.status} ${response.statusText}`);
      
      if (response.status === 200 || response.status === 201) {
        console.log(`   🎉 SUCESSO! Este endpoint funciona!`);
        
        // Tentar identificar o tipo de resposta
        const contentType = response.headers['content-type'];
        console.log(`   📦 Content-Type: ${contentType}`);
        
        if (typeof response.data === 'string' && response.data.startsWith('/9j/')) {
          console.log(`   🖼️ Resposta parece ser Base64 de imagem JPEG`);
          const buffer = Buffer.from(response.data, 'base64');
          console.log(`   📏 Tamanho decodificado: ${buffer.length} bytes`);
          
          // Salvar para teste
          const outputPath = path.join(__dirname, 'uploads', `test-${endpoint.name.replace(/[^a-z0-9]/gi, '-')}.jpg`);
          fs.writeFileSync(outputPath, buffer);
          console.log(`   💾 Salvo em: ${outputPath}`);
          
        } else if (Buffer.isBuffer(response.data) || response.data instanceof ArrayBuffer) {
          console.log(`   🖼️ Resposta é dados binários`);
          console.log(`   📏 Tamanho: ${response.data.byteLength || response.data.length} bytes`);
        } else if (typeof response.data === 'object') {
          console.log(`   📋 Resposta JSON:`, JSON.stringify(response.data, null, 2).substring(0, 300));
        }
        
      } else if (response.status === 404) {
        console.log(`   ❌ Endpoint não existe (404)`);
      } else if (response.status === 400) {
        console.log(`   ⚠️ Bad Request - Formato de dados incorreto`);
        console.log(`   📋 Resposta:`, JSON.stringify(response.data, null, 2).substring(0, 200));
      } else if (response.status === 401 || response.status === 403) {
        console.log(`   🔒 Erro de autenticação`);
      } else {
        console.log(`   ⚠️ Resposta inesperada`);
        console.log(`   📋 Dados:`, JSON.stringify(response.data, null, 2).substring(0, 200));
      }

    } catch (error: any) {
      if (error.code === 'ECONNABORTED') {
        console.log(`   ⏱️ Timeout (${error.message})`);
      } else {
        console.log(`   ❌ Erro: ${error.message}`);
      }
    }
  }

  console.log('\n\n✅ Teste de endpoints concluído!');
}

testEndpoints().catch(console.error);
