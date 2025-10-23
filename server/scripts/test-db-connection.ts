import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('🔍 Testando conexão com o banco de dados...\n');
    
    // Testar conexão
    await prisma.$connect();
    console.log('✅ Conexão estabelecida com sucesso!\n');
    
    // Contar registros
    const usersCount = await prisma.user.count();
    const instancesCount = await prisma.whatsAppInstance.count();
    const messagesCount = await prisma.message.count();
    
    console.log('📊 Estatísticas do banco de dados:');
    console.log(`   👥 Usuários: ${usersCount}`);
    console.log(`   📱 Instâncias: ${instancesCount}`);
    console.log(`   💬 Mensagens: ${messagesCount}\n`);
    
    // Listar usuários
    if (usersCount > 0) {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          active: true,
          createdAt: true
        }
      });
      
      console.log('👥 Usuários cadastrados:');
      users.forEach(user => {
        console.log(`   • ${user.name} (${user.email}) - ${user.role} - ${user.active ? 'Ativo' : 'Inativo'}`);
      });
      console.log('');
    }
    
    // Informações do banco
    const dbInfo = await prisma.$queryRaw`
      SELECT 
        current_database() as database,
        current_user as user,
        version() as version
    ` as any[];
    
    console.log('🗄️  Informações do banco:');
    console.log(`   Database: ${dbInfo[0].database}`);
    console.log(`   User: ${dbInfo[0].user}`);
    console.log(`   Version: ${dbInfo[0].version.split(',')[0]}\n`);
    
    console.log('🎉 Tudo funcionando perfeitamente!');
    
  } catch (error: any) {
    console.error('❌ Erro ao conectar com o banco de dados:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testConnection()
  .catch((error) => {
    console.error('Erro fatal:', error);
    process.exit(1);
  });
