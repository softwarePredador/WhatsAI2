import { dashboardService } from '../src/services/dashboard-service';
import { prisma } from '../src/database/prisma';

async function testDashboardService() {
  console.log('🧪 Testando DashboardService...\n');

  try {
    // Get first user for testing
    const user = await prisma.user.findFirst();

    if (!user) {
      console.log('❌ Nenhum usuário encontrado no banco de dados');
      console.log('💡 Crie um usuário primeiro para testar o dashboard');
      return;
    }

    console.log(`👤 Testando com usuário: ${user.email}\n`);

    // Test 1: Metrics
    console.log('📊 Teste 1: Métricas Gerais');
    console.log('━'.repeat(60));
    const metrics = await dashboardService.getMetrics(user.id, 'USER');
    console.log(`✅ Total de mensagens: ${metrics.totalMessages}`);
    console.log(`✅ Instâncias ativas: ${metrics.activeInstances}`);
    console.log(`✅ Total de conversas: ${metrics.totalConversations}`);
    console.log(`✅ Taxa de entrega: ${metrics.deliveryRate}%`);
    console.log(`✅ Armazenamento usado: ${(metrics.storageUsed / 1024 / 1024).toFixed(2)} MB`);
    console.log(`✅ Custos totais: $${metrics.costs.total.toFixed(2)}`);
    console.log('');

    // Test 2: Message Chart Data
    console.log('📈 Teste 2: Dados do Gráfico (últimos 7 dias)');
    console.log('━'.repeat(60));
    const chartData = await dashboardService.getMessageChartData(user.id, 7);
    console.log(`✅ ${chartData.length} dias de dados retornados`);
    chartData.forEach(day => {
      console.log(`   ${day.date}: ${day.messages} msgs (${day.delivered} entregues, ${day.failed} falhas)`);
    });
    console.log('');

    // Test 3: Instance Status
    console.log('🔌 Teste 3: Status das Instâncias');
    console.log('━'.repeat(60));
    const instanceStatus = await dashboardService.getInstanceStatusData(user.id);
    console.log(`✅ ${instanceStatus.length} status diferentes encontrados`);
    instanceStatus.forEach(status => {
      console.log(`   ${status.status}: ${status.count} instâncias (${status.percentage.toFixed(1)}%)`);
    });
    console.log('');

    // Test 4: Cost Data
    console.log('💰 Teste 4: Dados de Custo (últimos 6 meses)');
    console.log('━'.repeat(60));
    const costData = await dashboardService.getCostData(user.id, 6);
    console.log(`✅ ${costData.length} meses de dados retornados`);
    costData.forEach(month => {
      console.log(`   ${month.month}: $${month.total.toFixed(2)} (API: $${month.evolutionApi}, Storage: $${month.storage.toFixed(2)})`);
    });
    console.log('');

    // Test 5: User Activity
    console.log('📅 Teste 5: Atividade do Usuário (últimos 7 dias)');
    console.log('━'.repeat(60));
    const activityData = await dashboardService.getUserActivityData(user.id, 7);
    console.log(`✅ ${activityData.length} dias de atividade`);
    activityData.forEach(day => {
      console.log(`   ${day.date}: ${day.activeUsers} usuários ativos, ${day.newUsers} novos`);
    });
    console.log('');

    // Test 6: Activity Log
    console.log('📝 Teste 6: Log de Atividades (últimas 10)');
    console.log('━'.repeat(60));
    const activityLog = await dashboardService.getActivityLog(user.id, 10);
    console.log(`✅ ${activityLog.length} atividades encontradas`);
    activityLog.forEach(log => {
      const time = new Date(log.timestamp).toLocaleString('pt-BR');
      console.log(`   [${time}] ${log.type}: ${log.description}`);
    });
    console.log('');

    // Test 7: Peak Hours
    console.log('⏰ Teste 7: Horários de Pico');
    console.log('━'.repeat(60));
    const peakHours = await dashboardService.getPeakUsageHours(user.id);
    console.log(`✅ Top ${peakHours.length} horários de pico:`);
    peakHours.forEach((peak, idx) => {
      console.log(`   ${idx + 1}. ${peak.hour}h - ${peak.count} mensagens`);
    });
    console.log('');

    // Test 8: Response Time Stats
    console.log('⚡ Teste 8: Estatísticas de Tempo de Resposta');
    console.log('━'.repeat(60));
    const responseStats = await dashboardService.getResponseTimeStats(user.id);
    console.log(`✅ Tempo médio: ${responseStats.average.toFixed(2)} minutos`);
    console.log(`✅ Tempo mediano: ${responseStats.median?.toFixed(2) || 0} minutos`);
    console.log(`✅ Tempo mínimo: ${responseStats.min?.toFixed(2) || 0} minutos`);
    console.log(`✅ Tempo máximo: ${responseStats.max?.toFixed(2) || 0} minutos`);
    console.log('');

    // Summary
    console.log('━'.repeat(60));
    console.log('✅ TODOS OS TESTES PASSARAM!');
    console.log('━'.repeat(60));
    console.log('');
    console.log('📋 Resumo:');
    console.log(`   • 8 métodos testados com sucesso`);
    console.log(`   • Usuário: ${user.email}`);
    console.log(`   • Mensagens: ${metrics.totalMessages}`);
    console.log(`   • Instâncias: ${metrics.activeInstances} ativas`);
    console.log(`   • Conversas: ${metrics.totalConversations}`);
    console.log('');

  } catch (error) {
    console.error('❌ Erro durante os testes:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run tests
testDashboardService()
  .then(() => {
    console.log('✅ Testes concluídos com sucesso');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Testes falhou:', error);
    process.exit(1);
  });
