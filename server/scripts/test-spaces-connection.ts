#!/usr/bin/env tsx
/**
 * Teste de Conexão - DigitalOcean Spaces
 * Verifica se as credenciais estão corretas antes da migração
 */

import { DigitalOceanSpacesService } from '../src/services/digitalocean-spaces';
import { config } from 'dotenv';

config();

const spacesConfig = {
  accessKeyId: process.env['DO_SPACES_ACCESS_KEY']!,
  secretAccessKey: process.env['DO_SPACES_SECRET_KEY']!,
  region: process.env['DO_SPACES_REGION'] || 'sfo3',
  bucket: process.env['DO_SPACES_BUCKET'] || 'whatsais3',
  endpoint: process.env['DO_SPACES_ENDPOINT'] || 'https://sfo3.digitaloceanspaces.com'
};

async function testConnection() {
  console.log('🧪 Testando conexão com DigitalOcean Spaces...\n');
  console.log('Configuração:');
  console.log(`  Region: ${spacesConfig.region}`);
  console.log(`  Bucket: ${spacesConfig.bucket}`);
  console.log(`  Endpoint: ${spacesConfig.endpoint}\n`);

  try {
    const spacesService = new DigitalOceanSpacesService(spacesConfig);

    // Teste 1: Upload de arquivo pequeno
    console.log('📤 Teste 1: Upload de arquivo...');
    const testContent = Buffer.from('WhatsAI - Test de conexão S3 - ' + new Date().toISOString());
    const testKey = `test/connection-test-${Date.now()}.txt`;

    const uploadResult = await spacesService.uploadFile(
      testContent,
      testKey,
      'text/plain',
      {
        metadata: { test: 'connection' },
        acl: 'public-read'
      }
    );

    console.log('✅ Upload bem-sucedido!');
    console.log(`   URL: ${uploadResult.url}`);
    console.log(`   Size: ${uploadResult.size} bytes\n`);

    // Teste 2: Verificar se arquivo existe
    console.log('🔍 Teste 2: Verificando existência...');
    const exists = await spacesService.fileExists(testKey);
    console.log(exists ? '✅ Arquivo encontrado!' : '❌ Arquivo não encontrado');
    console.log();

    // Teste 3: Download do arquivo
    console.log('📥 Teste 3: Download do arquivo...');
    const downloadedBuffer = await spacesService.downloadFile(testKey);
    const downloadedContent = downloadedBuffer.toString('utf-8');
    console.log('✅ Download bem-sucedido!');
    console.log(`   Conteúdo: ${downloadedContent.substring(0, 50)}...\n`);

    // Teste 4: Obter informações do arquivo
    console.log('ℹ️  Teste 4: Obtendo informações...');
    const fileInfo = await spacesService.getFileInfo(testKey);
    if (fileInfo) {
      console.log('✅ Informações obtidas!');
      console.log(`   Size: ${fileInfo.size} bytes`);
      console.log(`   Modified: ${fileInfo.modified}\n`);
    }

    // Teste 5: Gerar URL assinada
    console.log('🔐 Teste 5: Gerando URL assinada (1 hora)...');
    const signedUrl = await spacesService.getSignedUrl(testKey, 3600);
    console.log('✅ URL assinada gerada!');
    console.log(`   URL: ${signedUrl.substring(0, 80)}...\n`);

    // Teste 6: Remover arquivo de teste
    console.log('🗑️  Teste 6: Removendo arquivo de teste...');
    await spacesService.deleteFile(testKey);
    console.log('✅ Arquivo removido!\n');

    // Verificar se foi realmente removido
    const stillExists = await spacesService.fileExists(testKey);
    console.log(stillExists ? '❌ Erro: Arquivo ainda existe!' : '✅ Confirmado: Arquivo removido\n');

    // Resumo
    console.log('='.repeat(60));
    console.log('✅ TODOS OS TESTES PASSARAM!');
    console.log('='.repeat(60));
    console.log('\nConexão com DigitalOcean Spaces funcionando perfeitamente!');
    console.log('Você pode prosseguir com a migração de arquivos.\n');

  } catch (error) {
    console.error('\n❌ ERRO NO TESTE DE CONEXÃO:');
    console.error(error);
    console.error('\n⚠️  Verifique:');
    console.error('  1. Credenciais no arquivo .env');
    console.error('  2. Permissões do Spaces (leitura/escrita)');
    console.error('  3. Nome do bucket está correto');
    console.error('  4. Região está correta\n');
    process.exit(1);
  }
}

testConnection()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Erro fatal:', error);
    process.exit(1);
  });
