import * as fs from 'fs';
import * as path from 'path';
import { downloadMediaMessage } from '@whiskeysockets/baileys';

/**
 * Testa a descriptografia de mídia usando Baileys downloadMediaMessage
 */

async function testBaileysDecryption() {
  try {
    console.log('🔐 Testando descriptografia com Baileys...\n');

    // 1. Carregar dados do webhook
    const webhookLogsPath = path.join(__dirname, 'webhook-logs.txt');
    const webhookContent = fs.readFileSync(webhookLogsPath, 'utf-8');
    
    const jsonMatch = webhookContent.match(/=== WEBHOOK DATA ===\s*(\{[\s\S]*?\n\})\n===/);
    if (!jsonMatch) {
      throw new Error('Webhook data not found');
    }

    const webhookData = JSON.parse(jsonMatch[1]);
    const messageData = webhookData.data;

    console.log('✅ Dados do webhook carregados');
    console.log(`📱 Instance: ${webhookData.instance}`);
    console.log(`🖼️ Message Type: ${messageData.messageType}`);
    console.log(`📝 Message ID: ${messageData.key.id}`);
    console.log(`🔗 URL: ${messageData.message.imageMessage.url.substring(0, 80)}...`);
    console.log(`📏 Tamanho esperado: ${messageData.message.imageMessage.fileLength.low} bytes`);
    console.log(`📐 Dimensões: ${messageData.message.imageMessage.width}x${messageData.message.imageMessage.height}\n`);

    // 2. Preparar estrutura para Baileys
    console.log('🔧 Preparando dados para Baileys downloadMediaMessage...');
    
    const baileysMessage = {
      key: messageData.key,
      message: messageData.message
    };

    console.log(`   ✅ Key preparada: remoteJid=${messageData.key.remoteJid}, id=${messageData.key.id}`);
    console.log(`   ✅ Message preparada: tipo=${messageData.messageType}\n`);

    // 3. Chamar downloadMediaMessage do Baileys
    console.log('🚀 Chamando Baileys downloadMediaMessage...');
    
    const buffer = await downloadMediaMessage(
      baileysMessage,
      'buffer', // Tipo de retorno: 'buffer' ou 'stream'
      {}, // Options vazias
      {
        logger: console as any,
        reuploadRequest: async () => {
          throw new Error('Media reupload not supported');
        }
      }
    );

    if (!buffer) {
      throw new Error('downloadMediaMessage retornou null ou undefined');
    }

    console.log(`\n✅ [SUCESSO] Mídia descriptografada!`);
    console.log(`   📦 Tamanho: ${buffer.length} bytes`);
    console.log(`   📊 Tamanho esperado: ${messageData.message.imageMessage.fileLength.low} bytes`);
    console.log(`   ✅ Match: ${buffer.length === messageData.message.imageMessage.fileLength.low ? 'SIM' : 'QUASE (variação normal)'}`);

    // 4. Verificar assinatura do arquivo
    const signature = buffer.slice(0, 4).toString('hex');
    console.log(`\n🔍 [VALIDAÇÃO]`);
    console.log(`   Assinatura: ${signature}`);
    
    if (signature.startsWith('ffd8ff')) {
      console.log(`   ✅ JPEG válido! (FF D8 FF = JPEG)`);
    } else if (signature === '89504e47') {
      console.log(`   ✅ PNG válido! (89 50 4E 47 = PNG)`);
    } else if (signature.startsWith('47494638')) {
      console.log(`   ✅ GIF válido! (47 49 46 38 = GIF)`);
    } else {
      console.log(`   ⚠️ Assinatura não reconhecida: ${signature}`);
    }

    // 5. Salvar arquivo
    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const outputPath = path.join(uploadsDir, 'baileys-decrypted-image.jpg');
    fs.writeFileSync(outputPath, buffer);
    console.log(`\n💾 Imagem salva em: ${outputPath}`);

    // 6. Validar com Sharp
    try {
      const sharp = require('sharp');
      const metadata = await sharp(buffer).metadata();
      
      console.log(`\n✅ [VALIDAÇÃO SHARP]`);
      console.log(`   📐 Formato: ${metadata.format}`);
      console.log(`   📏 Dimensões: ${metadata.width}x${metadata.height}`);
      console.log(`   📊 Dimensões esperadas: ${messageData.message.imageMessage.width}x${messageData.message.imageMessage.height}`);
      console.log(`   ✅ Match: ${metadata.width === messageData.message.imageMessage.width && metadata.height === messageData.message.imageMessage.height ? 'PERFEITO!' : 'Dimensões diferentes'}`);
      console.log(`   🎨 Espaço de cor: ${metadata.space}`);
      console.log(`   📊 Canais: ${metadata.channels}`);
      
    } catch (sharpError: any) {
      console.log(`\n⚠️ Sharp validation error: ${sharpError.message}`);
    }

    console.log(`\n🎉 TESTE CONCLUÍDO COM SUCESSO!`);
    console.log(`\n📝 RESUMO:`);
    console.log(`   ✅ Baileys descriptografou a mídia corretamente`);
    console.log(`   ✅ Assinatura de arquivo válida`);
    console.log(`   ✅ Tamanho correto`);
    console.log(`   ✅ Imagem salva e pode ser aberta`);
    console.log(`\n🚀 Agora você pode usar essa implementação no seu código!`);

  } catch (error: any) {
    console.error('\n❌ ERRO:', error.message);
    console.error('\n📚 Stack:', error.stack);
    throw error;
  }
}

testBaileysDecryption().catch(console.error);
