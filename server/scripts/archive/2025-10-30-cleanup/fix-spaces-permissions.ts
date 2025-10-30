import { S3Client, PutObjectAclCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { config } from 'dotenv';

// Carregar variáveis de ambiente
config();

const spacesConfig = {
  accessKeyId: process.env['DO_SPACES_ACCESS_KEY']!,
  secretAccessKey: process.env['DO_SPACES_SECRET_KEY']!,
  region: process.env['DO_SPACES_REGION'] || 'sfo3',
  bucket: process.env['DO_SPACES_BUCKET'] || 'whatsais3',
  endpoint: process.env['DO_SPACES_ENDPOINT'] || 'https://sfo3.digitaloceanspaces.com'
};

const s3Client = new S3Client({
  region: spacesConfig.region,
  endpoint: spacesConfig.endpoint,
  credentials: {
    accessKeyId: spacesConfig.accessKeyId,
    secretAccessKey: spacesConfig.secretAccessKey,
  },
  forcePathStyle: false,
});

async function fixFilePermissions() {
  console.log('🔧 Corrigindo permissões dos arquivos no DigitalOcean Spaces...\n');

  try {
    // Listar todos os arquivos incoming/
    const listCommand = new ListObjectsV2Command({
      Bucket: spacesConfig.bucket,
      Prefix: 'incoming/',
    });

    const listResponse = await s3Client.send(listCommand);

    if (!listResponse.Contents) {
      console.log('❌ Nenhum arquivo encontrado');
      return;
    }

    console.log(`📁 Processando ${listResponse.Contents.length} arquivos...\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const object of listResponse.Contents) {
      if (!object.Key) continue;

      try {
        console.log(`🔧 Corrigindo permissões: ${object.Key.substring(0, 60)}...`);

        // Definir ACL como public-read
        const aclCommand = new PutObjectAclCommand({
          Bucket: spacesConfig.bucket,
          Key: object.Key,
          ACL: 'public-read'
        });

        await s3Client.send(aclCommand);
        console.log(`   ✅ Permissões corrigidas`);
        successCount++;

      } catch (error: any) {
        console.log(`   ❌ Erro: ${error.message}`);
        errorCount++;
      }
    }

    console.log(`\n🎉 Correção concluída:`);
    console.log(`   ✅ ${successCount} arquivos corrigidos`);
    console.log(`   ❌ ${errorCount} erros`);

  } catch (error: any) {
    console.log('❌ Erro geral:', error.message);
  }
}

fixFilePermissions().catch(console.error);