import * as fs from 'fs';
import * as path from 'path';
import { downloadMediaMessage } from '@whiskeysockets/baileys';

/**
 * Testa a descriptografia com conversão correta dos dados
 */

async function testBaileysDecryptionFixed() {
  try {
    console.log('🔐 Testando descriptografia com Baileys (FIXED)...\n');

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
    console.log(`📝 Message ID: ${messageData.key.id}\n`);

    // 2. Converter arrays numéricos para Buffers
    console.log('🔧 Convertendo arrays numéricos para Buffers...');
    
    const imageMessage = messageData.message.imageMessage;
    
    // Converter os campos que são arrays numéricos para Buffer
    if (imageMessage.mediaKey && typeof imageMessage.mediaKey === 'object') {
      imageMessage.mediaKey = Buffer.from(Object.values(imageMessage.mediaKey));
      console.log(`   ✅ mediaKey convertida: ${imageMessage.mediaKey.length} bytes`);
    }
    
    if (imageMessage.fileEncSha256 && typeof imageMessage.fileEncSha256 === 'object') {
      imageMessage.fileEncSha256 = Buffer.from(Object.values(imageMessage.fileEncSha256));
      console.log(`   ✅ fileEncSha256 convertida: ${imageMessage.fileEncSha256.length} bytes`);
    }
    
    if (imageMessage.fileSha256 && typeof imageMessage.fileSha256 === 'object') {
      imageMessage.fileSha256 = Buffer.from(Object.values(imageMessage.fileSha256));
      console.log(`   ✅ fileSha256 convertida: ${imageMessage.fileSha256.length} bytes`);
    }
    
    if (imageMessage.jpegThumbnail && typeof imageMessage.jpegThumbnail === 'object') {
      imageMessage.jpegThumbnail = Buffer.from(Object.values(imageMessage.jpegThumbnail));
      console.log(`   ✅ jpegThumbnail convertida: ${imageMessage.jpegThumbnail.length} bytes`);
    }

    // 3. Preparar estrutura para Baileys
    const baileysMessage = {
      key: messageData.key,
      message: messageData.message
    };

    console.log(`\n🚀 Chamando Baileys downloadMediaMessage...`);
    
    const buffer = await downloadMediaMessage(
      baileysMessage,
      'buffer',
      {},
      {
        logger: console as any,
        reuploadRequest: async () => {
          throw new Error('Media reupload not supported');
        }
      }
    );

    if (!buffer) {
      throw new Error('downloadMediaMessage retornou null');
    }

    console.log(`\n✅ [SUCESSO] Mídia descriptografada!`);
    console.log(`   📦 Tamanho: ${buffer.length} bytes`);
    console.log(`   📊 Tamanho esperado: ${messageData.message.imageMessage.fileLength.low} bytes`);

    // Verificar assinatura
    const signature = buffer.slice(0, 4).toString('hex');
    console.log(`\n🔍 [VALIDAÇÃO]`);
    console.log(`   Assinatura: ${signature}`);
    
    if (signature.startsWith('ffd8ff')) {
      console.log(`   ✅ JPEG válido!`);
    } else {
      console.log(`   ⚠️ Assinatura: ${signature}`);
    }

    // Salvar
    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const outputPath = path.join(uploadsDir, 'baileys-decrypted-FIXED.jpg');
    fs.writeFileSync(outputPath, buffer);
    console.log(`\n💾 Imagem salva em: ${outputPath}`);

    // Validar com Sharp
    try {
      const sharp = require('sharp');
      const metadata = await sharp(buffer).metadata();
      
      console.log(`\n✅ [SHARP VALIDATION]`);
      console.log(`   📐 Formato: ${metadata.format}`);
      console.log(`   📏 Dimensões: ${metadata.width}x${metadata.height}`);
      console.log(`   🎨 Espaço de cor: ${metadata.space}`);
      
    } catch (sharpError: any) {
      console.log(`\n⚠️ Sharp error: ${sharpError.message}`);
    }

    console.log(`\n🎉 TESTE CONCLUÍDO COM SUCESSO!`);

  } catch (error: any) {
    console.error('\n❌ ERRO:', error.message);
    if (error.stack) {
      console.error('\n📚 Stack:', error.stack.split('\n').slice(0, 5).join('\n'));
    }
    throw error;
  }
}

testBaileysDecryptionFixed().catch(console.error);
