import { IncomingMediaService } from './src/services/incoming-media-service';

async function testImageDownload() {
  console.log('🧪 Testando download de imagem...');

  const service = new IncomingMediaService();

  // Testar com uma URL do WhatsApp dos logs
  const whatsappUrl = 'https://mmg.whatsapp.net/o1/v/t24/f2/m269/AQOLyNUm3LoW3zZF2uqcC-6wep5cjl99c_mN5gjqy7zIfSJFIut1QwqbiQ';

  try {
    // Acessar o método privado downloadMedia usando reflexão
    const downloadMethod = (service as any).downloadMedia.bind(service);
    const buffer = await downloadMethod(whatsappUrl);

    console.log('✅ Download concluído!');
    console.log('📏 Tamanho do buffer:', buffer.length);
    console.log('🔍 Primeiros 8 bytes (hex):', buffer.subarray(0, 8).toString('hex'));

    // Verificar se é uma imagem válida
    const signature = buffer.subarray(0, 4).toString('hex');
    console.log('🖼️ Assinatura detectada:', signature);

    const validSignatures = ['ffd8ffe0', 'ffd8ffe1', 'ffd8ffe2', '89504e47', '47494638'];
    if (validSignatures.some(sig => signature.startsWith(sig))) {
      console.log('✅ Imagem válida!');
    } else {
      console.log('❌ Assinatura inválida - imagem corrompida!');
      console.log('🔍 Investigando primeiros 64 bytes:');
      console.log(buffer.subarray(0, 64).toString('hex').match(/.{1,16}/g)?.join(' '));
    }

  } catch (error: any) {
    console.error('❌ Erro no teste:', error.message);
    console.error('Stack:', error.stack);
  }
}

testImageDownload();