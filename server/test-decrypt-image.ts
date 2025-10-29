import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Script para testar a descriptografia de imagem usando Evolution API
 * Lê dados do webhook-logs.txt e chama Evolution API para descriptografar
 */

async function testDecryptImage() {
  try {
    console.log('🔐 Iniciando teste de descriptografia de imagem...\n');

    // 1. Ler o arquivo de logs do webhook
    const webhookLogsPath = path.join(__dirname, 'webhook-logs.txt');
    const webhookContent = fs.readFileSync(webhookLogsPath, 'utf-8');
    
    // 2. Extrair o JSON do webhook (pegar o primeiro objeto JSON completo)
    const jsonMatch = webhookContent.match(/=== WEBHOOK DATA ===\s*(\{[\s\S]*?\n\})\n===/);
    if (!jsonMatch) {
      throw new Error('❌ Não foi possível encontrar dados do webhook no arquivo');
    }

    const webhookData = JSON.parse(jsonMatch[1]);
    console.log('✅ Dados do webhook carregados');
    console.log(`📱 Instance: ${webhookData.instance}`);
    console.log(`🖼️ Message Type: ${webhookData.data.messageType}`);
    console.log(`🔗 URL: ${webhookData.data.message.imageMessage.url.substring(0, 80)}...`);
    console.log(`📏 Tamanho esperado: ${webhookData.data.message.imageMessage.fileLength.low} bytes`);
    console.log(`📐 Dimensões: ${webhookData.data.message.imageMessage.width}x${webhookData.data.message.imageMessage.height}\n`);

    // 3. Preparar requisição para Evolution API
    const evolutionApiUrl = process.env.EVOLUTION_API_URL || 'https://hsapi.studio';
    const evolutionApiKey = process.env.EVOLUTION_API_KEY || '717376BB-0133-4A66-8994-BCA8A6F039D9';
    const instanceName = webhookData.instance;

    console.log(`🌐 Evolution API: ${evolutionApiUrl}`);
    console.log(`🔑 API Key: ${evolutionApiKey.substring(0, 20)}...`);
    console.log(`📱 Instance: ${instanceName}\n`);

    // 4. Chamar Evolution API para descriptografar
    console.log('🚀 Chamando Evolution API para descriptografar mídia...');
    
    const response = await axios.post(
      `${evolutionApiUrl}/message/downloadMedia/${instanceName}`,
      {
        message: webhookData.data
      },
      {
        headers: {
          'apikey': evolutionApiKey,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer',
        timeout: 60000
      }
    );

    console.log(`✅ Mídia descriptografada com sucesso!`);
    console.log(`📦 Tamanho recebido: ${response.data.byteLength} bytes\n`);

    // 5. Salvar imagem descriptografada
    const buffer = Buffer.from(response.data);
    const outputPath = path.join(__dirname, 'uploads', 'decrypted-image.jpg');
    
    // Criar diretório se não existir
    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, buffer);
    console.log(`💾 Imagem salva em: ${outputPath}`);

    // 6. Validar com Sharp (se disponível)
    try {
      const sharp = require('sharp');
      const metadata = await sharp(buffer).metadata();
      
      console.log('\n✅ [VALIDAÇÃO SHARP]');
      console.log(`   📐 Formato: ${metadata.format}`);
      console.log(`   📏 Dimensões: ${metadata.width}x${metadata.height}`);
      console.log(`   🎨 Espaço de cor: ${metadata.space}`);
      console.log(`   📦 Tamanho: ${buffer.length} bytes`);
      
      // Mostrar os primeiros bytes (assinatura do arquivo)
      const signature = buffer.slice(0, 4).toString('hex');
      console.log(`   🔍 Assinatura: ${signature} (deve começar com ffd8ff para JPEG)`);
      
    } catch (sharpError) {
      console.log('\n⚠️ Sharp não disponível, pulando validação avançada');
    }

    // 7. Mostrar informações sobre a thumbnail (que já vem descriptografada)
    const thumbnailData = webhookData.data.message.imageMessage.jpegThumbnail;
    if (thumbnailData) {
      const thumbnailBuffer = Buffer.from(Object.values(thumbnailData));
      const thumbnailSignature = thumbnailBuffer.slice(0, 4).toString('hex');
      console.log(`\n📸 [THUMBNAIL DO WEBHOOK]`);
      console.log(`   📦 Tamanho: ${thumbnailBuffer.length} bytes`);
      console.log(`   🔍 Assinatura: ${thumbnailSignature} (já vem descriptografado)`);
      
      // Salvar thumbnail também
      const thumbnailPath = path.join(__dirname, 'uploads', 'thumbnail.jpg');
      fs.writeFileSync(thumbnailPath, thumbnailBuffer);
      console.log(`   💾 Thumbnail salvo em: ${thumbnailPath}`);
    }

    console.log('\n🎉 Teste concluído com sucesso!');
    console.log(`\n📂 Arquivos gerados:`);
    console.log(`   - ${outputPath} (imagem completa descriptografada)`);
    console.log(`   - ${path.join(__dirname, 'uploads', 'thumbnail.jpg')} (thumbnail do webhook)`);

  } catch (error: any) {
    console.error('\n❌ Erro durante o teste:', error.message);
    
    if (error.response) {
      console.error(`📛 Status: ${error.response.status}`);
      console.error(`📛 Response:`, error.response.data?.toString() || error.response.data);
    }
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Dica: Verifique se a Evolution API está acessível em:', process.env.EVOLUTION_API_URL);
    }
    
    throw error;
  }
}

// Executar
testDecryptImage().catch(console.error);
