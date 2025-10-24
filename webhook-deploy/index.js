// index.js - Webhook receiver para EasyPanel
const express = require('express');
const { PrismaClient } = require('@prisma/client');

const PORT = process.env.PORT || 3002;

const app = express();
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgres://postgres:78ffa3b05805066f6719@143.198.230.247:5432/halder?sslmode=disable"
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
    // PROCESSAR messages.update PARA MAPEAR @lid → número real
    // ========================================
    if (webhookData.event === 'messages.update' && webhookData.data) {
      const { keyId, remoteJid } = webhookData.data;
      
      if (keyId && remoteJid) {
        // Se for número real (@s.whatsapp.net), armazenar no cache
        if (remoteJid.includes('@s.whatsapp.net')) {
          keyIdToRealNumberCache.set(keyId, remoteJid);
          console.log(`🔑 [${instanceId}] Mapeamento salvo: keyId ${keyId} → ${remoteJid}`);
        }
        // Se for @lid, tentar buscar o número real do cache
        else if (remoteJid.includes('@lid')) {
          const realNumber = keyIdToRealNumberCache.get(keyId);
          if (realNumber) {
            console.log(`✅ [${instanceId}] @lid resolvido: ${remoteJid} → ${realNumber} (via keyId ${keyId})`);
          } else {
            console.log(`⚠️ [${instanceId}] @lid ${remoteJid} ainda não tem mapeamento (keyId: ${keyId})`);
          }
        }
      }
      
      // messages.update não precisa criar conversa/mensagem, só mapear
      return res.json({ success: true, message: 'Mapping processed' });
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
      const messageContent = messageData.message.conversation || 
                            messageData.message.extendedTextMessage?.text ||
                            'Mensagem sem texto';
      
      console.log(`💬 [${instanceId}] Processando mensagem: ${messageContent}`);
      console.log(`📱 [${instanceId}] remoteJid original: ${remoteJid}`);
      
      // 🔄 Se for @lid, tentar resolver para número real
      if (remoteJid.includes('@lid')) {
        // Buscar no banco de dados por messageId que já tenha esse remoteJid
        const existingMessage = await prisma.message.findFirst({
          where: { 
            instanceId: instanceId,
            remoteJid: { contains: remoteJid.split('@')[0] } // Busca pelo número base
          },
          orderBy: { createdAt: 'desc' }
        });
        
        if (existingMessage && existingMessage.remoteJid.includes('@s.whatsapp.net')) {
          console.log(`✅ [${instanceId}] @lid resolvido via banco: ${remoteJid} → ${existingMessage.remoteJid}`);
          remoteJid = existingMessage.remoteJid;
        } else {
          console.log(`⚠️ [${instanceId}] @lid não resolvido, usando normalização padrão: ${remoteJid}`);
        }
      }
      
      // Buscar instância
      const instance = await prisma.whatsAppInstance.findFirst({
        where: { id: instanceId }
      });
      
      if (!instance) {
        console.log(`⚠️ Instância ${instanceId} não encontrada`);
        res.json({ success: true, message: 'Instance not found' });
        return;
      }
      
      // ========================================
      // NORMALIZAÇÃO COMPLETA (igual ao backend)
      // ========================================
      // Passo 1: Remover device IDs (:98, :4, etc)
      let normalizedJid = remoteJid.replace(/:\d+@/, '@');
      
      // Passo 2: Remover todos os sufixos do WhatsApp
      normalizedJid = normalizedJid
        .replace('@s.whatsapp.net', '')
        .replace('@g.us', '')
        .replace('@c.us', '')
        .replace('@lid', '');
      
      // Passo 3: Re-adicionar sufixo correto
      // Grupos mantém @g.us, demais usam @s.whatsapp.net
      const formattedJid = normalizedJid.includes('-') 
        ? `${normalizedJid}@g.us` 
        : `${normalizedJid}@s.whatsapp.net`;
      
      console.log(`🔄 [${instanceId}] Normalização: ${remoteJid} → ${formattedJid}`);
      
      // Buscar ou criar conversa usando JID formatado
      let conversation = await prisma.conversation.findFirst({
        where: { 
          instanceId: instanceId,
          remoteJid: formattedJid
        }
      });
      
      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            instanceId,
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
            instanceId,
            remoteJid: formattedJid,
            messageId: messageId,
            conversationId: conversation.id,
            fromMe,
            content: messageContent,
            messageType: 'TEXT',
            timestamp: new Date(messageData.messageTimestamp * 1000)
          }
        });
        
        console.log(`✅ [${instanceId}] Mensagem salva: ${message.id}`);
        
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