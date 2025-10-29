import * as fs from 'fs';
import * as path from 'path';

/**
 * Extrai a thumbnail JPEG do webhook (que já vem descriptografada)
 */

async function extractThumbnail() {
  try {
    console.log('📸 Extraindo thumbnail do webhook...\n');

    // 1. Ler o arquivo de logs do webhook
    const webhookLogsPath = path.join(__dirname, 'webhook-logs.txt');
    const webhookContent = fs.readFileSync(webhookLogsPath, 'utf-8');
    
    // 2. Extrair o JSON do webhook
    const jsonMatch = webhookContent.match(/=== WEBHOOK DATA ===\s*(\{[\s\S]*?\n\})\n===/);
    if (!jsonMatch) {
      throw new Error('❌ Não foi possível encontrar dados do webhook no arquivo');
    }

    const webhookData = JSON.parse(jsonMatch[1]);
    console.log('✅ Dados do webhook carregados');
    
    // 3. Extrair jpegThumbnail
    const thumbnailData = webhookData.data.message.imageMessage.jpegThumbnail;
    if (!thumbnailData) {
      throw new Error('❌ Thumbnail não encontrada no webhook');
    }

    // 4. Converter objeto numérico para Buffer
    const thumbnailBuffer = Buffer.from(Object.values(thumbnailData));
    
    console.log(`✅ Thumbnail extraída`);
    console.log(`   📦 Tamanho: ${thumbnailBuffer.length} bytes`);
    
    // 5. Analisar assinatura do arquivo
    const signature = thumbnailBuffer.slice(0, 4).toString('hex');
    console.log(`   🔍 Assinatura: ${signature}`);
    
    if (signature.startsWith('ffd8ff')) {
      console.log(`   ✅ Assinatura JPEG válida! (FF D8 FF = JPEG)`);
    } else {
      console.log(`   ⚠️ Assinatura inesperada`);
    }
    
    // 6. Salvar thumbnail
    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    const outputPath = path.join(uploadsDir, 'thumbnail-from-webhook.jpg');
    fs.writeFileSync(outputPath, thumbnailBuffer);
    console.log(`\n💾 Thumbnail salva em: ${outputPath}`);
    
    // 7. Validar com Sharp (se disponível)
    try {
      const sharp = require('sharp');
      const metadata = await sharp(thumbnailBuffer).metadata();
      
      console.log('\n✅ [VALIDAÇÃO SHARP]');
      console.log(`   📐 Formato: ${metadata.format}`);
      console.log(`   📏 Dimensões: ${metadata.width}x${metadata.height}`);
      console.log(`   🎨 Espaço de cor: ${metadata.space}`);
      console.log(`   📊 Canais: ${metadata.channels}`);
      
    } catch (sharpError) {
      console.log('\n⚠️ Sharp não disponível ou erro na validação');
    }
    
    console.log('\n🎉 Thumbnail extraída com sucesso!');
    console.log(`\n📝 IMPORTANTE: Esta é uma thumbnail de baixa resolução.`);
    console.log(`   A imagem completa está encriptada e precisa da Evolution API para descriptografar.`);
    console.log(`   Dimensões originais: 900x1600 (${webhookData.data.message.imageMessage.fileLength.low} bytes)`);

  } catch (error: any) {
    console.error('\n❌ Erro:', error.message);
    throw error;
  }
}

// Executar
extractThumbnail().catch(console.error);
