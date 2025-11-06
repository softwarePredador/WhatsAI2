#!/usr/bin/env node

/**
 * Análise de Dados Úteis nos Webhooks
 * 
 * Este script analisa o webhook-logs.txt para identificar:
 * 1. Campos disponíveis em cada tipo de evento
 * 2. Dados que podem estar sendo ignorados
 * 3. Informações úteis que podem ser aproveitadas
 */

const fs = require('fs');
const path = require('path');

const webhookLogPath = path.join(__dirname, 'webhook-logs.txt');

if (!fs.existsSync(webhookLogPath)) {
  console.error('❌ webhook-logs.txt não encontrado');
  process.exit(1);
}

const content = fs.readFileSync(webhookLogPath, 'utf8');
const entries = content.split('=== END ENTRY ===');

console.log('📊 ANÁLISE DE DADOS ÚTEIS NOS WEBHOOKS\n');
console.log('='.repeat(80) + '\n');

// Coletar campos por tipo de evento
const eventFieldsMap = new Map();

let totalEntries = 0;
let parsedEntries = 0;

for (const entry of entries) {
  if (!entry.trim()) continue;
  totalEntries++;

  const dataMatch = entry.match(/=== WEBHOOK DATA ===\n({[\s\S]*?})\n===/);
  if (!dataMatch) continue;

  try {
    const webhookData = JSON.parse(dataMatch[1]);
    parsedEntries++;

    const eventType = webhookData.event || 'unknown';

    if (!eventFieldsMap.has(eventType)) {
      eventFieldsMap.set(eventType, {
        count: 0,
        fields: new Set(),
        samples: []
      });
    }

    const eventInfo = eventFieldsMap.get(eventType);
    eventInfo.count++;

    // Coletar campos recursivamente
    const collectFields = (obj, prefix = '') => {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const fullKey = prefix ? `${prefix}.${key}` : key;
          eventInfo.fields.add(fullKey);

          if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
            collectFields(obj[key], fullKey);
          }
        }
      }
    };

    collectFields(webhookData);

    // Guardar amostra
    if (eventInfo.samples.length < 1) {
      eventInfo.samples.push(webhookData);
    }
  } catch (e) {
    // Ignorar erros de parse
  }
}

console.log(`✅ Total de entradas: ${totalEntries}`);
console.log(`✅ Entradas parseadas: ${parsedEntries}\n`);

// Analisar cada tipo de evento
const sortedEvents = Array.from(eventFieldsMap.entries()).sort((a, b) => b[1].count - a[1].count);

for (const [eventType, eventInfo] of sortedEvents) {
  console.log('\n' + '='.repeat(80));
  console.log(`📋 EVENTO: ${eventType}`);
  console.log(`   Ocorrências: ${eventInfo.count}`);
  console.log(`   Campos disponíveis: ${eventInfo.fields.size}`);
  console.log('');

  const fields = Array.from(eventInfo.fields).sort();
  
  // Campos relevantes por tipo de evento
  const relevantFields = {
    'messages.upsert': [
      'data.key.remoteJid',
      'data.key.fromMe',
      'data.key.participant',
      'data.key.participantAlt',
      'data.messageTimestamp',
      'data.pushName',
      'data.message',
      'data.messageType',
      'data.status'
    ],
    'messages.update': [
      'data.key.remoteJid',
      'data.key.id',
      'data.status',
      'data.participant'
    ],
    'send.message': [
      'data.key.remoteJid',
      'data.key.id',
      'data.message',
      'data.messageType',
      'data.status',
      'data.source',
      'data.instanceId'
    ],
    'contacts.update': [
      'data.id',
      'data.name',
      'data.pushName',
      'data.profilePictureUrl'
    ],
    'chats.upsert': [
      'data.id',
      'data.name',
      'data.unreadCount',
      'data.conversationTimestamp'
    ]
  };

  console.log('   📌 Campos Importantes:');
  const important = relevantFields[eventType] || [];
  for (const field of important) {
    const exists = fields.includes(field);
    console.log(`      ${exists ? '✅' : '❌'} ${field}`);
  }

  console.log('\n   📦 Todos os campos disponíveis:');
  fields.slice(0, 30).forEach(field => {
    console.log(`      - ${field}`);
  });

  if (fields.length > 30) {
    console.log(`      ... e mais ${fields.length - 30} campos`);
  }

  // Mostrar amostra de dados
  if (eventInfo.samples.length > 0) {
    console.log('\n   📄 Amostra de dados:');
    const sample = eventInfo.samples[0];
    console.log(JSON.stringify(sample, null, 2).substring(0, 1000));
    console.log('   ...');
  }
}

console.log('\n\n' + '='.repeat(80));
console.log('🔍 DADOS POTENCIALMENTE ÚTEIS NÃO APROVEITADOS:\n');

// Análise específica de dados úteis
console.log('1. PARTICIPANT E PARTICIPANT_ALT (em grupos):');
console.log('   - participant: ID com @lid (ID interno do WhatsApp)');
console.log('   - participantAlt: Número real do telefone');
console.log('   - ✅ Útil para: Identificar remetentes reais em grupos');
console.log('   - 📝 Status: Já sendo processado no sistema\n');

console.log('2. MESSAGE STATUS (messages.update):');
console.log('   - PENDING, SENT, DELIVERED, READ, PLAYED');
console.log('   - ✅ Útil para: Rastreamento de status de mensagens');
console.log('   - 📝 Status: Campo existe no banco (Message.status)\n');

console.log('3. MESSAGE SOURCE (send.message):');
console.log('   - web, mobile, api');
console.log('   - ✅ Útil para: Identificar origem das mensagens');
console.log('   - ❓ Status: Verificar se está sendo salvo\n');

console.log('4. PROFILE PICTURE URL (contacts.update):');
console.log('   - profilePictureUrl');
console.log('   - ✅ Útil para: Exibir fotos de perfil dos contatos');
console.log('   - ❓ Status: Verificar se está sendo salvo\n');

console.log('5. UNREAD COUNT (chats.upsert):');
console.log('   - unreadCount');
console.log('   - ✅ Útil para: Sincronizar contador de não lidas');
console.log('   - ✅ Status: Já sendo usado (Conversation.unreadCount)\n');

console.log('6. CONVERSATION TIMESTAMP (chats.upsert):');
console.log('   - conversationTimestamp');
console.log('   - ✅ Útil para: Ordenar conversas por última atividade');
console.log('   - ✅ Status: Já sendo usado (Conversation.lastMessageAt)\n');

console.log('7. CONTEXT INFO (messages.upsert):');
console.log('   - mentionedJid: Pessoas mencionadas');
console.log('   - quotedMessage: Mensagem sendo respondida');
console.log('   - ✅ Útil para: Contexto de mensagens e respostas');
console.log('   - ❓ Status: Verificar se está sendo aproveitado\n');

console.log('\n' + '='.repeat(80));
console.log('✅ ANÁLISE COMPLETA');
console.log('='.repeat(80) + '\n');
