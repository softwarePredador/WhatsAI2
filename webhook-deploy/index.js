// Imports necessários
const express = require('express');
const { PrismaClient } = require('@prisma/client');

// Função para normalizar números brasileiros
function normalizeBrazilianNumber(remoteJid) {
  if (!remoteJid.includes('@s.whatsapp.net')) {
    return remoteJid; // Não é um número individual
  }
  
  const number = remoteJid.replace('@s.whatsapp.net', '');
  
  // Se for brasileiro, garantir que tenha o formato correto com 9º dígito
  if (number.startsWith('55')) {
    // Verificar se é um número brasileiro válido
    const withoutCountry = number.substring(2); // Remove "55"
    
    if (withoutCountry.length === 10) {
      // 10 dígitos (DDD + 8 dígitos do telefone) - adicionar 9º dígito
      const ddd = withoutCountry.substring(0, 2);
      const phone = withoutCountry.substring(2);
      const normalized = `55${ddd}9${phone}@s.whatsapp.net`;
      console.log(`🇧🇷 Normalizando brasileiro (10→11 dígitos): ${remoteJid} → ${normalized}`);
      return normalized;
    } else if (withoutCountry.length === 9) {
      // 9 dígitos (DDD + 7 dígitos do telefone) - adicionar 9º dígito
      const ddd = withoutCountry.substring(0, 2);
      const phone = withoutCountry.substring(2);
      const normalized = `55${ddd}9${phone}@s.whatsapp.net`;
      console.log(`🇧🇷 Normalizando brasileiro (9→11 dígitos): ${remoteJid} → ${normalized}`);
      return normalized;
    } else if (withoutCountry.length === 11) {
      // Já tem 11 dígitos (DDD + 9 + 8 dígitos) - formato correto
      return remoteJid;
    } else if (withoutCountry.length === 8) {
      // 8 dígitos (telefone antigo sem DDD) - adicionar DDD 11 + 9º dígito
      const normalized = `55119${number.substring(2)}@s.whatsapp.net`;
      console.log(`🇧🇷 Normalizando brasileiro (8→11 dígitos): ${remoteJid} → ${normalized}`);
      return normalized;
    }
  }
  
  return remoteJid; // Já está no formato correto ou não é brasileiro
}

// Carregar variáveis de ambiente
require('dotenv').config();

const PORT = process.env.PORT || 3002;

const app = express();
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgres://postgres:78ffa3b05805066f6719@banco_halder-db:5432/halder?sslmode=disable"
    }
  }
});

// Cache em memória para mapear keyId → remoteJid real
const keyIdToRealNumberCache = new Map();

app.use(express.json());

// Endpoint webhook para Evolution API - GENÉRICO para múltiplas instâncias
app.post('/api/webhooks/evolution/:instanceId', async (req, res) => {
  try {
    const { instanceId } = req.params;
    const webhookData = req.body;
    
    console.log(`📨 Webhook recebido para instância ${instanceId}:`, JSON.stringify(webhookData, null, 2));

    // ========================================
    // PROCESSAR messages.update (ATUALIZAR STATUS DAS MENSAGENS)
    // Evolution API v2.3.6+ envia status updates com messageId
    // ========================================
    if (webhookData.event === 'messages.update' && webhookData.data) {
      const { messageId, keyId, remoteJid, status, fromMe } = webhookData.data;
      
      console.log(`📬 [${instanceId}] Status update: ${status} (messageId: ${messageId || 'N/A'}, keyId: ${keyId})`);
      
      // Normalizar status da Evolution API para nosso schema
      const normalizedStatus = {
        'PENDING': 'PENDING',
        'SERVER_ACK': 'SENT',
        'DELIVERY_ACK': 'DELIVERED',
        'READ': 'READ',
        'PLAYED': 'PLAYED',
        'ERROR': 'FAILED'
      }[status] || status;
      
      // Se tiver messageId, atualizar status no banco
      if (messageId && normalizedStatus) {
        try {
          const updated = await prisma.message.updateMany({
            where: { 
              id: messageId,
              // Segurança: garantir que é da instância correta
              conversation: {
                instance: {
                  evolutionInstanceName: instanceId
                }
              }
            },
            data: {
              status: normalizedStatus
            }
          });
          
          if (updated.count > 0) {
            console.log(`✅ [${instanceId}] Status atualizado: ${messageId} → ${normalizedStatus}`);
          } else {
            console.log(`⚠️ [${instanceId}] Mensagem não encontrada: ${messageId}`);
          }
        } catch (error) {
          console.error(`❌ [${instanceId}] Erro ao atualizar status:`, error.message);
        }
      }
      
      // Manter cache de keyId para compatibilidade
      if (keyId && remoteJid) {
        keyIdToRealNumberCache.set(keyId, remoteJid);
      }
      
      return res.json({ success: true, message: 'Status updated' });
    }

    // ========================================
    // PROCESSAR messages.upsert (MENSAGENS REAIS)
    // ========================================
    // Verificar se é uma mensagem
    if (webhookData.data && webhookData.data.key && webhookData.data.message) {
      const messageData = webhookData.data;
      
      // Extrair dados da mensagem
      let remoteJid = messageData.key.remoteJid;
      const messageId = messageData.key.id;
      const fromMe = messageData.key.fromMe;
      const participant = messageData.key.participant; // Para mensagens de grupo
      const pushName = messageData.pushName; // Nome do contato
      const messageContent = messageData.message.conversation || 
                            messageData.message.extendedTextMessage?.text ||
                            'Mensagem sem texto';
      
      console.log(`💬 [${instanceId}] Processando mensagem: ${messageContent}`);
      console.log(`📱 [${instanceId}] remoteJid: ${remoteJid}, fromMe: ${fromMe}`);
      if (participant) console.log(`👤 [${instanceId}] participant: ${participant}`);
      if (pushName) console.log(`� [${instanceId}] pushName: ${pushName}`);
      
      // 🎯 Evolution API v2.3.5+ já converte @lid para número real!
      // Não precisamos mais de lógica complexa de resolução
      if (remoteJid.includes('@lid')) {
        console.log(`⚠️ [${instanceId}] ⚠️ ALERTA: @lid detectado! Evolution API deveria ter convertido.`);
        console.log(`⚠️ [${instanceId}] Verifique se está usando Evolution API v2.3.5 ou superior.`);
        // Não processar mensagens @lid - Evolution API deve resolver
        return res.json({ success: true, message: 'LID not resolved by Evolution API' });
      }
      
      // Buscar instância PRIMEIRO (por evolutionInstanceName, não por id)
      const instance = await prisma.whatsAppInstance.findFirst({
        where: { evolutionInstanceName: instanceId }
      });
      
      if (!instance) {
        console.log(`⚠️ Instância ${instanceId} não encontrada no banco`);
        return res.json({ success: true, message: 'Instance not found' });
      }
      
      console.log(`✅ [${instanceId}] Instância encontrada: ${instance.id}`);
      
      // ========================================
      // NORMALIZAÇÃO SIMPLIFICADA
      // Evolution API já resolve @lid, só precisamos normalizar formato
      // ========================================
      const isGroup = remoteJid.includes('@g.us') || remoteJid.includes('-');
      
      // Remover device IDs (:98, :4, etc)
      let normalizedJid = remoteJid.replace(/:\d+@/, '@');
      
      // Remover sufixos do WhatsApp
      normalizedJid = normalizedJid
        .replace('@s.whatsapp.net', '')
        .replace('@g.us', '')
        .replace('@c.us', '');
      
      // Re-adicionar sufixo correto
      let formattedJid = isGroup
        ? `${normalizedJid}@g.us` 
        : `${normalizedJid}@s.whatsapp.net`;
      
      // Aplicar normalização brasileira se for número individual
      if (!isGroup) {
        formattedJid = normalizeBrazilianNumber(formattedJid);
      }
      
      console.log(`🔄 [${instanceId}] Normalização: ${remoteJid} → ${formattedJid}`);
      
      // Buscar ou criar conversa usando JID formatado (COM O ID REAL DO BANCO)
      let conversation = await prisma.conversation.findFirst({
        where: { 
          instanceId: instance.id,
          remoteJid: formattedJid
        }
      });
      
      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            instanceId: instance.id,
            remoteJid: formattedJid,
            contactName: normalizedJid,
            isGroup: formattedJid.includes('@g.us'),
            lastMessage: messageContent,
            lastMessageAt: new Date(),
            unreadCount: fromMe ? 0 : 1,
            isArchived: false,
            isPinned: false
          }
        });
        console.log(`🆕 [${instanceId}] Nova conversa criada: ${formattedJid}`);
      }
      
      // Criar mensagem com tratamento de duplicatas
      try {
        const message = await prisma.message.create({
          data: {
            instanceId: instance.id,
            remoteJid: formattedJid,
            messageId: messageId,
            conversationId: conversation.id,
            fromMe,
            content: messageContent,
            messageType: 'TEXT',
            timestamp: new Date(messageData.messageTimestamp * 1000),
            status: fromMe ? 'SENT' : 'DELIVERED' // Status inicial baseado em quem enviou
          }
        });
        
        console.log(`✅ [${instanceId}] Mensagem salva: ${message.id} (status: ${message.status})`);
        
      } catch (msgError) {
        // Tratar duplicata de messageId (erro P2002)
        if (msgError.code === 'P2002' && msgError.meta?.target?.includes('messageId')) {
          console.log(`⚠️ [${instanceId}] Mensagem duplicada (messageId: ${messageId}), ignorando...`);
          return res.json({ success: true, message: 'Duplicate message ignored' });
        }
        throw msgError;
      }
      
      // Atualizar conversa com última mensagem
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          lastMessage: messageContent,
          lastMessageAt: new Date(),
          unreadCount: fromMe ? conversation.unreadCount : conversation.unreadCount + 1
        }
      });
      
      console.log(`📝 [${instanceId}] Conversa atualizada`);
    }
    
    res.json({ success: true, message: 'Webhook processado', instanceId });
    
  } catch (error) {
    console.error(`❌ Erro ao processar webhook [${req.params.instanceId}]:`, error);
    res.status(500).json({ success: false, error: error.message, instanceId: req.params.instanceId });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'webhook-receiver'
  });
});

// Endpoint raiz
app.get('/', (req, res) => {
  res.json({ 
    message: 'WhatsAI Webhook Receiver - Microserviço',
    description: 'Recebe webhooks de múltiplas instâncias Evolution API',
    endpoints: {
      webhook: '/api/webhooks/evolution/:instanceId',
      health: '/health',
      instances: '/instances'
    },
    usage: {
      webhook: 'POST /api/webhooks/evolution/{instanceId}',
      example: 'POST /api/webhooks/evolution/cmh250j8e0001s1sh1i19esvz'
    }
  });
});

// Endpoint para listar instâncias ativas
app.get('/instances', async (req, res) => {
  try {
    const instances = await prisma.instance.findMany({
      include: {
        conversations: {
          take: 1,
          orderBy: { timestamp: 'desc' }
        },
        _count: {
          select: { conversations: true }
        }
      }
    });
    
    res.json({ 
      success: true, 
      total: instances.length,
      instances: instances.map(inst => ({
        id: inst.id,
        instanceId: inst.instanceId,
        instanceName: inst.instanceName,
        status: inst.status,
        conversationCount: inst._count.conversations,
        lastActivity: inst.conversations[0]?.timestamp || inst.updatedAt
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 Webhook Receiver rodando na porta ${PORT}`);
  console.log(`📡 Endpoint: http://localhost:${PORT}/api/webhooks/evolution/:instanceId`);
  console.log(`🔗 Health: http://localhost:${PORT}/health`);
});