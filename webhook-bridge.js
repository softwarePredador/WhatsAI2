// webhook-bridge.js - Para rodar no Digital Ocean
const express = require('express');
const app = express();

app.use(express.json());

// Recebe webhook da Evolution API
app.post('/api/webhooks/evolution/:instanceId', async (req, res) => {
  console.log('📨 Webhook recebido no servidor:', req.body);
  
  try {
    // Encaminha para o desenvolvimento local via túnel
    const response = await fetch('https://seu-tunel.ngrok.io/api/webhooks/evolution/' + req.params.instanceId, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    
    console.log('✅ Encaminhado para desenvolvimento local');
    res.json({ success: true, forwarded: true });
  } catch (error) {
    console.error('❌ Erro ao encaminhar:', error);
    res.json({ success: true, error: error.message });
  }
});

app.listen(3001, () => {
  console.log('🌉 Webhook Bridge rodando na porta 3001');
});