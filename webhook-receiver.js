// Função para normalizar números brasileiros
function normalizeBrazilianNumber(remoteJid) {
  if (!remoteJid.includes('@s.whatsapp.net')) {
    return remoteJid; // Não é um número individual
  }
  
  const number = remoteJid.replace('@s.whatsapp.net', '');
  
  // Se for brasileiro e tiver 11 dígitos (sem 9º dígito), adicionar o 9º dígito
  if (number.startsWith('55') && number.length === 11) {
    const ddd = number.substring(2, 4);
    const phone = number.substring(4);
    const normalized = `55${ddd}9${phone}@s.whatsapp.net`;
    console.log(`🇧🇷 Normalizando brasileiro: ${remoteJid} → ${normalized}`);
    return normalized;
  }
  
  return remoteJid; // Já está no formato correto ou não é brasileiro
}

const app = express();
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgres://postgres:78ffa3b05805066f6719@banco_halder-db:5432/halder?sslmode=disable"
    }
  }
});

app.use(express.json());

// Endpoint webhook para Evolution API
app.post('/api/webhooks/evolution/:instanceId', async (req, res) => {
  try {
    const { instanceId } = req.params;
    const webhookData = req.body;
    
    console.log(`📨 Webhook recebido para instância ${instanceId}:`, webhookData);

    // Verificar se é uma mensagem
    if (webhookData.data && webhookData.data.key && webhookData.data.message) {
      const messageData = webhookData.data;
      
      // Extrair dados da mensagem
      const rawRemoteJid = messageData.key.remoteJid;
      const remoteJid = normalizeBrazilianNumber(rawRemoteJid);
      const messageId = messageData.key.id;
      const fromMe = messageData.key.fromMe;
      const messageContent = messageData.message.conversation || 
                            messageData.message.extendedTextMessage?.text ||
                            'Mensagem sem texto';
      
      console.log(`💬 Processando mensagem: ${messageContent}`);
      
      // Buscar ou criar conversa
      let conversation = await prisma.conversation.findUnique({
        where: { remoteJid }
      });
      
      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            remoteJid,
            instanceId,
            lastMessageAt: new Date(),
            unreadCount: 0
          }
        });
        console.log(`🆕 Nova conversa criada: ${remoteJid}`);
      }
      
      // Criar mensagem
      const message = await prisma.message.create({
        data: {
          id: messageId,
          conversationId: conversation.id,
          content: messageContent,
          fromMe,
          timestamp: new Date(messageData.messageTimestamp * 1000),
          status: 'received'
        }
      });
      
      // Atualizar conversa
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          lastMessageAt: new Date(),
          unreadCount: fromMe ? conversation.unreadCount : conversation.unreadCount + 1
        }
      });
      
      console.log(`✅ Mensagem salva no banco: ${message.id}`);
    }
    
    res.json({ success: true, message: 'Webhook processado' });
    
  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🌐 Webhook Receiver rodando na porta ${PORT}`);
  console.log(`📡 Endpoint: http://localhost:${PORT}/api/webhooks/evolution/:instanceId`);
  console.log(`🔗 Health: http://localhost:${PORT}/health`);
});