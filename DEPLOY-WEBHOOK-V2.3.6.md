# 🚀 Deploy Webhook v2.3.6 - Guia Rápido

## ✨ O que há de novo nesta versão?

### 🎯 **Compatível com Evolution API v2.3.5+**

Esta versão aproveita as **melhorias automáticas** da Evolution API v2.3.5 e v2.3.6:

✅ **@lid resolvido automaticamente** - Sem conversas duplicadas  
✅ **Status de mensagens** - READ, PLAYED, DELIVERED atualizados no banco  
✅ **Código 66% menor** - Lógica simplificada e mais rápida  
✅ **Cache otimizado** - Funciona corretamente para @lid/PN/g.us  

---

## 📦 Deploy no Easypanel

### 1. **Upload do ZIP**
```bash
# Arquivo para upload:
webhook-deploy-v2.3.6.zip
```

### 2. **Configurar no Easypanel**

**Build Settings:**
- Framework: Node.js
- Build Command: `npm install`
- Start Command: `node index.js`
- Port: `3002` (ou qualquer porta livre)

**Environment Variables:**
```env
PORT=3002
NODE_ENV=production
```

### 3. **Configurar Domínio**

Exemplo: `https://teta-webhook.8ktevp.easypanel.host`

### 4. **Configurar Webhook na Evolution API**

No momento de criar instância, usar:
```
https://teta-webhook.8ktevp.easypanel.host/api/webhooks/evolution/{instanceName}
```

---

## ✅ Verificação Pós-Deploy

### **1. Testar Endpoint Health**
```bash
curl https://teta-webhook.8ktevp.easypanel.host/health
```

**Resposta esperada:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-24T..."
}
```

### **2. Verificar Logs**

Criar nova instância e verificar se aparecem logs:
```
📨 Webhook recebido para instância ...
💬 Processando mensagem: ...
✅ Mensagem salva: ...
```

### **3. Testar com Mensagens Reais**

1. Criar instância no WhatsAI
2. Conectar celular via QR Code
3. Enviar mensagem para um contato
4. Verificar no banco se aparece:
   - ✅ Conversa criada com número correto
   - ✅ Mensagem salva
   - ✅ Sem @lid nos logs
   - ✅ Status atualizado (DELIVERED → READ)

### **4. Verificar que NÃO aparece @lid**

Se aparecer @lid nos logs:
```
⚠️ ALERTA: @lid detectado! Evolution API deveria ter convertido.
```

**Isso significa que a Evolution API NÃO está na v2.3.5+**

---

## 🔧 Troubleshooting

### ❌ **Problema: Ainda vejo @lid nos logs**

**Causa:** Evolution API desatualizada (< v2.3.5)

**Solução:**
```bash
# Verificar versão da Evolution API
curl https://hsapi.studio/health

# Atualizar para v2.3.6
docker pull atendai/evolution-api:v2.3.6
docker-compose up -d
```

### ❌ **Problema: Status das mensagens não atualiza**

**Causa:** `messageId` não está vindo em `messages.update`

**Verificação:**
1. Verificar logs do webhook
2. Deve aparecer: `"messageId": "cmh..."`
3. Se não aparecer, Evolution API < v2.3.6

**Solução:** Atualizar Evolution API para v2.3.6

### ❌ **Problema: Conversas duplicadas**

**Causa Possível #1:** Evolution API < v2.3.5  
**Solução:** Atualizar Evolution API

**Causa Possível #2:** Banco com dados antigos  
**Solução:** Limpar conversas antigas
```bash
# No servidor WhatsAI
cd server
npx tsx scripts/clear-conversations.ts
```

### ❌ **Problema: Webhook não recebe eventos**

**Verificação:**
```bash
# Testar se webhook está acessível
curl -X POST https://teta-webhook.8ktevp.easypanel.host/api/webhooks/evolution/test \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

**Solução:**
1. Verificar se Easypanel está rodando
2. Verificar domínio configurado corretamente
3. Verificar firewall/CORS
4. Reconfigurar webhook na instância

---

## 📊 Comparação: Antes vs Depois

### **ANTES (v2.3.4 e anteriores):**

```javascript
// ~150 linhas de código complexo
if (remoteJid.includes('@lid')) {
  // Tentativa 1: usar sender
  if (sender) remoteJid = sender;
  
  // Tentativa 2: buscar cache
  else if (cache.has(remoteJid)) {
    remoteJid = cache.get(remoteJid);
  }
  
  // Tentativa 3: buscar banco
  else {
    const conv = await prisma.conversation.findFirst({...});
    if (conv) remoteJid = conv.remoteJid;
  }
  
  // Tentativa 4: buscar por keyId
  else {
    const keyId = extractKeyId(...);
    const number = keyIdCache.get(keyId);
    if (number) remoteJid = number;
  }
}
```

❌ **Problemas:**
- Lento (múltiplas queries)
- Complexo (difícil manutenção)
- Não confiável (pode falhar)
- Conversas duplicadas

### **AGORA (v2.3.5+):**

```javascript
// ~50 linhas - Evolution API resolve!
if (remoteJid.includes('@lid')) {
  console.log('⚠️ Evolution API deveria ter resolvido @lid');
  return res.json({ success: true });
}

// Apenas normalizar formato
const normalizedJid = remoteJid.replace(/:\d+@/, '@');
```

✅ **Benefícios:**
- Rápido (sem queries extras)
- Simples (fácil manutenção)
- Confiável (Evolution API garante)
- Uma conversa por pessoa

---

## 📝 Changelog Webhook

### **v2.3.6 (24/10/2025)**

**Features:**
- ✅ Compatibilidade com Evolution API v2.3.5+
- ✅ Atualização automática de status (READ/PLAYED/DELIVERED)
- ✅ Alerta se @lid ainda aparecer (API desatualizada)
- ✅ Documentação completa das mudanças

**Removed:**
- ❌ Lógica manual de resolução @lid (desnecessária)
- ❌ Cache complexo de @lid
- ❌ Múltiplas tentativas de resolução
- ❌ Busca em banco para @lid

**Performance:**
- 🚀 66% menos código
- 🚀 Eliminadas queries desnecessárias ao banco
- 🚀 Processamento mais rápido de mensagens

---

## 🎯 Checklist de Deploy

- [ ] Evolution API atualizada para v2.3.6
- [ ] ZIP `webhook-deploy-v2.3.6.zip` criado
- [ ] Upload no Easypanel concluído
- [ ] Domínio configurado
- [ ] Variáveis de ambiente definidas
- [ ] Health check funcionando
- [ ] Webhook configurado nas instâncias
- [ ] Teste com mensagem real realizado
- [ ] Verificado que não aparece @lid nos logs
- [ ] Status das mensagens atualizando
- [ ] Sem conversas duplicadas

---

## 📚 Documentação Adicional

- **Mudanças Evolution API:** `EVOLUTION-API-V2.3.5-CHANGES.md`
- **Deploy Detalhado:** `webhook-deploy/DEPLOY.md`
- **Deploy Rápido:** `webhook-deploy/DEPLOY-RAPIDO.md`

---

## 🆘 Suporte

Se encontrar problemas:

1. Verificar logs do webhook
2. Verificar versão Evolution API
3. Verificar configuração do webhook
4. Consultar `EVOLUTION-API-V2.3.5-CHANGES.md`

---

**Versão:** v2.3.6  
**Data:** 24/10/2025  
**Compatibilidade:** Evolution API v2.3.5+  
**Status:** ✅ Pronto para Produção
