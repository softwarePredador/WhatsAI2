import 'dotenv/config';
import { IncomingMediaService } from './src/services/incoming-media-service';

async function testInstantiation() {
  console.log('🔍 Testando instanciação do IncomingMediaService...');

  try {
    const service = new IncomingMediaService();
    console.log('✅ IncomingMediaService instanciado com sucesso');

    // Verificar se as variáveis estão disponíveis
    console.log('DO_SPACES_ACCESS_KEY presente:', !!process.env.DO_SPACES_ACCESS_KEY);
    console.log('DO_SPACES_SECRET_KEY presente:', !!process.env.DO_SPACES_SECRET_KEY);
    console.log('DO_SPACES_BUCKET:', process.env.DO_SPACES_BUCKET);
    console.log('DO_SPACES_REGION:', process.env.DO_SPACES_REGION);
  } catch (error) {
    console.log('❌ Erro na instanciação:', error instanceof Error ? error.message : String(error));
  }
}

testInstantiation();