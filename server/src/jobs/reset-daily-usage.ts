/**
 * Daily Usage Reset Job
 * Task 3.5: Sistema de Limites e Quotas
 * 
 * Resets daily usage counters for all users at midnight
 * Should be run as a cron job: 0 0 * * * (every day at midnight)
 */

import PlansService from '../services/plans-service';

async function resetDailyUsage() {
  console.log('🔄 Iniciando reset de uso diário...');
  console.log('⏰ Horário:', new Date().toISOString());

  try {
    const result = await PlansService.resetAllDailyUsage();

    console.log('✅ Reset concluído com sucesso!');
    console.log(`📊 Usuários resetados: ${result.resetCount}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return result;
  } catch (error) {
    console.error('❌ Erro ao resetar uso diário:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  resetDailyUsage()
    .then(() => {
      console.log('✅ Job finalizado com sucesso');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Job finalizado com erro:', error);
      process.exit(1);
    });
}

export default resetDailyUsage;
