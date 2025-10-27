import AWS from 'aws-sdk';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

async function configureSpacesCORS() {
  console.log('🔧 [CORS] Configurando CORS para DigitalOcean Spaces...');

  try {
    // Configurar AWS SDK para DigitalOcean Spaces
    const spacesEndpoint = new AWS.Endpoint('https://sfo3.digitaloceanspaces.com');
    const s3 = new AWS.S3({
      endpoint: spacesEndpoint,
      accessKeyId: process.env.DO_SPACES_ACCESS_KEY,
      secretAccessKey: process.env.DO_SPACES_SECRET_KEY,
      region: 'sfo3'
    });

    const bucketName = 'whatsais3';

    // Configuração CORS para permitir acesso do frontend
    const corsConfiguration = {
      CORSRules: [
        {
          AllowedHeaders: ['*'],
          AllowedMethods: ['GET', 'HEAD'],
          AllowedOrigins: ['http://localhost:3000', 'http://127.0.0.1:3000'], // Allow frontend on port 3000
          MaxAgeSeconds: 3000
        }
      ]
    };

    console.log('📡 Enviando configuração CORS...');
    console.log('Bucket:', bucketName);
    console.log('Configuração:', JSON.stringify(corsConfiguration, null, 2));

    const result = await s3.putBucketCors({
      Bucket: bucketName,
      CORSConfiguration: corsConfiguration
    }).promise();

    console.log('✅ CORS configurado com sucesso!');
    console.log('Resultado:', result);

  } catch (error) {
    console.error('❌ Erro ao configurar CORS:', error);
  }
}

configureSpacesCORS();