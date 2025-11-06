/**
 * Análise Completa do Fluxo de Mensagens e Limites
 * 
 * Este script analisa:
 * 1. Se as mensagens estão sendo contabilizadas corretamente
 * 2. Fluxo completo de envio e recebimento de mensagens
 * 3. Dados úteis disponíveis nos webhooks
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface UsageStats {
  messages_today: number;
  last_reset: string;
  campaigns_this_month?: number;
  storage_used_gb?: number;
}

interface WebhookEventSummary {
  event: string;
  count: number;
  fieldsAvailable: Set<string>;
  sampleData?: any;
}

async function analyzeMessageCounting() {
  console.log('\n📊 ANÁLISE DE CONTABILIZAÇÃO DE MENSAGENS\n');
  console.log('='.repeat(80));

  // 1. Verificar usuários e seus limites
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      plan: true,
      planLimits: true,
      usageStats: true,
      _count: {
        select: {
          instances: true,
          messageTemplates: true,
        }
      }
    }
  });

  console.log(`\n✅ Total de usuários: ${users.length}\n`);

  for (const user of users) {
    console.log(`\n👤 Usuário: ${user.name} (${user.email})`);
    console.log(`   Plano: ${user.plan}`);
    
    try {
      const planLimits = typeof user.planLimits === 'string' 
        ? JSON.parse(user.planLimits) 
        : user.planLimits;
      console.log(`   Limite de mensagens/dia: ${planLimits.messages_per_day === -1 ? 'Ilimitado' : planLimits.messages_per_day}`);
    } catch (e) {
      console.log(`   ⚠️ Erro ao parsear planLimits`);
    }

    try {
      const usageStats = typeof user.usageStats === 'string'
        ? JSON.parse(user.usageStats)
        : user.usageStats as unknown as UsageStats;
      
      console.log(`   Mensagens hoje: ${usageStats.messages_today || 0}`);
      console.log(`   Último reset: ${usageStats.last_reset || 'N/A'}`);
    } catch (e) {
      console.log(`   ⚠️ Erro ao parsear usageStats`);
    }

    console.log(`   Instâncias: ${user._count.instances}`);
    console.log(`   Templates: ${user._count.messageTemplates}`);
  }

  // 2. Verificar mensagens enviadas hoje
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  console.log('\n\n📤 MENSAGENS ENVIADAS HOJE (fromMe=true)\n');
  console.log('='.repeat(80));

  const messagesSentToday = await prisma.message.groupBy({
    by: ['instanceId', 'fromMe'],
    where: {
      timestamp: {
        gte: today
      },
      fromMe: true
    },
    _count: {
      id: true
    }
  });

  console.log(`\n✅ Total de registros de mensagens enviadas: ${messagesSentToday.length}\n`);

  for (const msgGroup of messagesSentToday) {
    const instance = await prisma.whatsAppInstance.findUnique({
      where: { id: msgGroup.instanceId },
      select: { name: true, userId: true, user: { select: { name: true } } }
    });

    console.log(`📱 Instância: ${instance?.name || msgGroup.instanceId}`);
    console.log(`   Usuário: ${instance?.user.name || 'N/A'}`);
    console.log(`   Mensagens enviadas hoje: ${msgGroup._count.id}`);
  }

  // 3. Verificar campanhas ativas e suas mensagens
  console.log('\n\n📢 CAMPANHAS E SUAS MENSAGENS\n');
  console.log('='.repeat(80));

  const campaigns = await prisma.campaign.findMany({
    where: {
      status: {
        in: ['RUNNING', 'SCHEDULED', 'PAUSED']
      }
    },
    select: {
      id: true,
      name: true,
      status: true,
      totalRecipients: true,
      sentCount: true,
      failedCount: true,
      pendingCount: true,
      createdAt: true,
      user: {
        select: {
          name: true,
          email: true
        }
      }
    }
  });

  console.log(`\n✅ Total de campanhas ativas: ${campaigns.length}\n`);

  for (const campaign of campaigns) {
    console.log(`📣 Campanha: ${campaign.name}`);
    console.log(`   Status: ${campaign.status}`);
    console.log(`   Usuário: ${campaign.user.name}`);
    console.log(`   Total destinatários: ${campaign.totalRecipients}`);
    console.log(`   Enviadas: ${campaign.sentCount}`);
    console.log(`   Falhadas: ${campaign.failedCount}`);
    console.log(`   Pendentes: ${campaign.pendingCount}`);
    console.log(`   Criada em: ${campaign.createdAt.toISOString()}`);
    console.log('');
  }

  // 4. Verificar auto-respostas ativas
  console.log('\n🤖 AUTO-RESPOSTAS ATIVAS\n');
  console.log('='.repeat(80));

  const autoResponses = await prisma.autoResponse.findMany({
    where: {
      active: true
    },
    select: {
      id: true,
      name: true,
      triggerCount: true,
      lastTriggeredAt: true,
      instance: {
        select: {
          name: true,
          user: {
            select: {
              name: true,
              email: true
            }
          }
        }
      }
    }
  });

  console.log(`\n✅ Total de auto-respostas ativas: ${autoResponses.length}\n`);

  for (const autoResp of autoResponses) {
    console.log(`🤖 Auto-resposta: ${autoResp.name}`);
    console.log(`   Instância: ${autoResp.instance.name}`);
    console.log(`   Usuário: ${autoResp.instance.user.name}`);
    console.log(`   Disparos: ${autoResp.triggerCount}`);
    console.log(`   Último disparo: ${autoResp.lastTriggeredAt?.toISOString() || 'Nunca'}`);
    console.log('');
  }
}

async function analyzeWebhookLogs() {
  console.log('\n\n📝 ANÁLISE DE WEBHOOKS\n');
  console.log('='.repeat(80));

  const webhookLogPath = path.join(process.cwd(), 'webhook-logs.txt');
  
  if (!fs.existsSync(webhookLogPath)) {
    console.log('⚠️ Arquivo webhook-logs.txt não encontrado');
    return;
  }

  const content = fs.readFileSync(webhookLogPath, 'utf8');
  const entries = content.split('=== END ENTRY ===');

  console.log(`\n✅ Total de entradas de webhook: ${entries.length - 1}\n`);

  // Analisar eventos únicos
  const eventTypes = new Map<string, WebhookEventSummary>();
  const fieldsMap = new Map<string, Set<string>>();

  let sendMessageCount = 0;
  let messagesUpsertCount = 0;
  let messagesUpdateCount = 0;

  for (const entry of entries) {
    if (!entry.trim()) continue;

    // Extrair event type
    const eventMatch = entry.match(/Event: ([^\n]+)/);
    if (!eventMatch) continue;

    const eventType = eventMatch[1];

    // Contar eventos específicos
    if (eventType === 'send.message') sendMessageCount++;
    if (eventType === 'messages.upsert') messagesUpsertCount++;
    if (eventType === 'messages.update') messagesUpdateCount++;

    // Extrair dados do webhook
    const dataMatch = entry.match(/=== WEBHOOK DATA ===\n({[\s\S]*?})\n===/);
    if (dataMatch) {
      try {
        const webhookData = JSON.parse(dataMatch[1]);
        
        if (!eventTypes.has(eventType)) {
          eventTypes.set(eventType, {
            event: eventType,
            count: 0,
            fieldsAvailable: new Set<string>(),
            sampleData: webhookData
          });
        }

        const summary = eventTypes.get(eventType)!;
        summary.count++;

        // Coletar campos disponíveis
        const collectFields = (obj: any, prefix = ''): void => {
          for (const key in obj) {
            const fullKey = prefix ? `${prefix}.${key}` : key;
            summary.fieldsAvailable.add(fullKey);

            if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
              collectFields(obj[key], fullKey);
            }
          }
        };

        collectFields(webhookData);
      } catch (e) {
        // Ignorar erros de parse
      }
    }
  }

  // Exibir resumo por tipo de evento
  console.log('\n📊 EVENTOS POR TIPO:\n');
  
  const sortedEvents = Array.from(eventTypes.values()).sort((a, b) => b.count - a.count);
  
  for (const event of sortedEvents) {
    console.log(`\n🔔 ${event.event}: ${event.count} eventos`);
    
    // Mostrar campos disponíveis (primeiros 20)
    const fields = Array.from(event.fieldsAvailable).sort();
    console.log(`   Campos disponíveis (${fields.length} total):`);
    fields.slice(0, 20).forEach(field => {
      console.log(`     - ${field}`);
    });
    if (fields.length > 20) {
      console.log(`     ... e mais ${fields.length - 20} campos`);
    }
  }

  // Análise específica de send.message
  console.log('\n\n📤 ANÁLISE DE send.message:\n');
  console.log(`Total de webhooks send.message: ${sendMessageCount}`);
  console.log('Este evento indica mensagens enviadas pelo sistema/usuário');
  console.log('Campos úteis disponíveis:');
  
  const sendMsgEvent = eventTypes.get('send.message');
  if (sendMsgEvent && sendMsgEvent.sampleData) {
    console.log('\nExemplo de dados:');
    console.log(JSON.stringify(sendMsgEvent.sampleData, null, 2).substring(0, 500));
  }

  console.log('\n\n📥 ANÁLISE DE messages.upsert:\n');
  console.log(`Total de webhooks messages.upsert: ${messagesUpsertCount}`);
  console.log('Este evento indica mensagens recebidas');
  
  console.log('\n\n🔄 ANÁLISE DE messages.update:\n');
  console.log(`Total de webhooks messages.update: ${messagesUpdateCount}`);
  console.log('Este evento indica atualizações de status de mensagens (lida, entregue, etc)');
}

async function analyzeMessageFlow() {
  console.log('\n\n🔍 ANÁLISE DO FLUXO COMPLETO DE MENSAGENS\n');
  console.log('='.repeat(80));

  console.log('\n📝 FLUXO ESPERADO:\n');
  console.log('1. ENVIO DE MENSAGEM:');
  console.log('   a) Usuário envia mensagem via API');
  console.log('   b) Sistema verifica limite (checkMessageLimit)');
  console.log('   c) Se permitido, envia via Evolution API');
  console.log('   d) Incrementa contador (incrementMessageCount)');
  console.log('   e) Webhook "send.message" é recebido');
  console.log('   f) Sistema salva mensagem no banco com fromMe=true');
  console.log('   g) Webhook "messages.update" atualiza status');
  console.log('');
  console.log('2. RECEBIMENTO DE MENSAGEM:');
  console.log('   a) WhatsApp recebe mensagem externa');
  console.log('   b) Evolution API envia webhook "messages.upsert"');
  console.log('   c) Sistema salva mensagem no banco com fromMe=false');
  console.log('   d) Sistema verifica auto-respostas');
  console.log('   e) Se houver match, envia auto-resposta (DEVERIA incrementar contador)');
  console.log('');
  console.log('3. CAMPANHAS:');
  console.log('   a) Usuário cria campanha');
  console.log('   b) Sistema verifica limite de campanhas');
  console.log('   c) Campanha dispara mensagens em lote');
  console.log('   d) CADA mensagem DEVERIA incrementar contador');
  console.log('   e) Webhooks "send.message" são recebidos');
  console.log('');

  console.log('\n⚠️ PROBLEMAS IDENTIFICADOS:\n');
  console.log('❌ 1. Rotas de conversação não verificam limites');
  console.log('   - /api/conversations/:conversationId/messages (POST)');
  console.log('   - /api/conversations/instance/:instanceId/send (POST)');
  console.log('');
  console.log('❌ 2. Auto-respostas não incrementam contador');
  console.log('   - processAutoResponses() em webhook-controller.ts');
  console.log('   - Envia mensagem mas não chama incrementMessageCount');
  console.log('');
  console.log('❌ 3. Campanhas não incrementam contador');
  console.log('   - sendCampaignMessage() em campaign-service.ts');
  console.log('   - Envia mensagens mas não chama incrementMessageCount');
  console.log('');
}

async function generateReport() {
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 RELATÓRIO COMPLETO DE ANÁLISE DE LIMITES E WEBHOOKS');
  console.log('='.repeat(80));

  await analyzeMessageCounting();
  await analyzeWebhookLogs();
  await analyzeMessageFlow();

  console.log('\n\n' + '='.repeat(80));
  console.log('✅ ANÁLISE COMPLETA');
  console.log('='.repeat(80) + '\n');
}

// Executar análise
generateReport()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
