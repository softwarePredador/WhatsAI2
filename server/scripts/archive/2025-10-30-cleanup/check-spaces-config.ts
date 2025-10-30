import { config } from 'dotenv';

// Carregar variáveis de ambiente
config();

console.log('🔍 Verificando configurações do DigitalOcean Spaces...\n');

// Verificar variáveis de ambiente
const spacesConfig = {
  accessKeyId: process.env['DO_SPACES_ACCESS_KEY'],
  secretAccessKey: process.env['DO_SPACES_SECRET_KEY'],
  region: process.env['DO_SPACES_REGION'] || 'sfo3',
  bucket: process.env['DO_SPACES_BUCKET'] || 'whatsais3',
  endpoint: process.env['DO_SPACES_ENDPOINT'] || 'https://sfo3.digitaloceanspaces.com'
};

console.log('📋 Configurações encontradas:');
console.log(`  Access Key: ${spacesConfig.accessKeyId ? '✅ Presente' : '❌ Ausente'}`);
console.log(`  Secret Key: ${spacesConfig.secretAccessKey ? '✅ Presente' : '❌ Ausente'}`);
console.log(`  Region: ${spacesConfig.region}`);
console.log(`  Bucket: ${spacesConfig.bucket}`);
console.log(`  Endpoint: ${spacesConfig.endpoint}\n`);

if (!spacesConfig.accessKeyId || !spacesConfig.secretAccessKey) {
  console.log('❌ ERRO: Credenciais do DigitalOcean Spaces não configuradas!');
  console.log('   Verifique se as variáveis de ambiente estão definidas no arquivo .env\n');
} else {
  console.log('✅ Credenciais configuradas corretamente\n');
}

// Testar conexão básica
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';

async function testSpacesConnection() {
  try {
    console.log('🔗 Testando conexão com DigitalOcean Spaces...');

    const s3Client = new S3Client({
      region: spacesConfig.region,
      endpoint: spacesConfig.endpoint,
      credentials: {
        accessKeyId: spacesConfig.accessKeyId!,
        secretAccessKey: spacesConfig.secretAccessKey!,
      },
      forcePathStyle: false,
    });

    const command = new HeadBucketCommand({
      Bucket: spacesConfig.bucket
    });

    await s3Client.send(command);
    console.log('✅ Conexão com bucket estabelecida com sucesso!\n');

  } catch (error: any) {
    console.log('❌ Erro na conexão com Spaces:', error.message);
    console.log('   Isso pode indicar problemas de permissão ou configuração\n');
  }
}

testSpacesConnection().catch(console.error);