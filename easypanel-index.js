// index.js - Webhook receiver para EasyPanel
const express = require('express');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgres://postgres:78ffa3b05805066f6719@banco_halder-db:5432/halder?sslmode=disable"
    }
  }
});

app.use(express.json());

// Endpoint webhook para Evolution API - GENÉRICO para múltiplas instâncias
app.post('/api/webhooks/evolution/:instanceId', async (req, res) => {
  try {
    const { instanceId } = req.params;
    const webhookData = req.body;
    
    console.log(`📨 Webhook recebido para instância ${instanceId}:`, JSON.stringify(webhookData, null, 2));

    // Verificar se é uma mensagem
    if (webhookData.data && webhookData.data.key && webhookData.data.message) {
      const messageData = webhookData.data;
      
      // Extrair dados da mensagem
      const remoteJid = messageData.key.remoteJid;
      const messageId = messageData.key.id;
      const fromMe = messageData.key.fromMe;
      const messageContent = messageData.message.conversation || 
                            messageData.message.extendedTextMessage?.text ||
                            'Mensagem sem texto';
      
      console.log(`💬 [${instanceId}] Processando mensagem: ${messageContent}`);
      
      // Buscar ou criar instância
      let instance = await prisma.instance.findUnique({
        where: { instanceId }
      });
      
      if (!instance) {
        instance = await prisma.instance.create({
          data: {
            instanceId,
            instanceName: `Instance ${instanceId.slice(0, 8)}`,
            status: 'CONNECTED'
          }
        });
        console.log(`🆕 Nova instância criada: ${instanceId}`);
      }
      
      // Buscar ou criar conversa
      let conversation = await prisma.conversation.findUnique({
        where: { 
          instanceId_chatId: {
            instanceId: instanceId,
            chatId: remoteJid
          }
        }
      });
      
      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            instanceId,
            chatId: remoteJid,
            chatName: remoteJid.split('@')[0],
            isGroup: remoteJid.includes('@g.us'),
            lastMessage: messageContent,
            timestamp: new Date()
          }
        });
        console.log(`🆕 [${instanceId}] Nova conversa criada: ${remoteJid}`);
      }
      
      // Criar mensagem
      const message = await prisma.message.create({
        data: {
          messageId: messageId,
          conversationId: conversation.id,
          fromMe,
          body: messageContent,
          type: 'text',
          timestamp: new Date(messageData.messageTimestamp * 1000)
        }
      });
      
      // Atualizar conversa
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          lastMessage: messageContent,
          timestamp: new Date()
        }
      });
      
      console.log(`✅ [${instanceId}] Mensagem salva: ${message.id}`);
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 Webhook Receiver rodando na porta ${PORT}`);
  console.log(`📡 Endpoint: http://localhost:${PORT}/api/webhooks/evolution/:instanceId`);
  console.log(`🔗 Health: http://localhost:${PORT}/health`);
});