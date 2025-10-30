import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
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

async function checkSpacesFiles() {
  console.log('🔍 Verificando arquivos no DigitalOcean Spaces...\n');

  try {
    // Listar arquivos no bucket
    const listCommand = new ListObjectsV2Command({
      Bucket: spacesConfig.bucket,
      Prefix: 'incoming/',
      MaxKeys: 20
    });

    const listResponse = await s3Client.send(listCommand);

    console.log(`📁 Arquivos encontrados no bucket "${spacesConfig.bucket}":`);
    console.log(`   Total: ${listResponse.KeyCount} arquivos\n`);

    if (listResponse.Contents) {
      listResponse.Contents.forEach((object, index) => {
        console.log(`${index + 1}. ${object.Key} (${(object.Size! / 1024).toFixed(1)} KB)`);
      });
    }

    console.log('\n🔗 Testando acesso aos arquivos...\n');

    // Testar alguns arquivos específicos
    const testKeys = [
      'incoming/image/1761489182561_dlnx2qy80_image_cmh7rdtht000510sihfvg0t56_ycfofbpkk_1761489182561.bin',
      'incoming/image/1761489114589_u1jib3sgq_image_cmh7svyog000212m10bzn3641_renltx1d8_1761489114589.bin'
    ];

    for (const key of testKeys) {
      try {
        console.log(`🔍 Verificando: ${key.substring(0, 60)}...`);

        // Verificar se o arquivo existe
        const headCommand = new GetObjectCommand({
          Bucket: spacesConfig.bucket,
          Key: key
        });

        const response = await s3Client.send(headCommand);
        console.log(`   ✅ Arquivo existe (${response.ContentLength} bytes)`);

        // Verificar ACL do arquivo
        console.log(`   📋 Content-Type: ${response.ContentType}`);
        console.log(`   🔒 ACL: ${response.Metadata?.['x-amz-acl'] || 'Não definido'}`);

      } catch (error: any) {
        console.log(`   ❌ Erro: ${error.message}`);
      }
      console.log('');
    }

  } catch (error: any) {
    console.log('❌ Erro ao listar arquivos:', error.message);
  }
}

checkSpacesFiles().catch(console.error);