# 🛡️ BUGFIX: Mensagens Duplicadas no Webhook Receiver

## Problema Identificado

O webhook receiver externo (`/app/index.js` no Easypanel) estava crashando com erro P2002:

```
❌ Erro ao processar webhook [whatsai_...]: PrismaClientKnownRequestError
Invalid `prisma.message.create()` invocation in /app/index.js:86:44
Unique constraint failed on the fields: (`messageId`)
```

**Causa:** Evolution API envia o mesmo webhook múltiplas vezes (especialmente para mensagens de grupo), causando violação de constraint unique no campo `messageId`.

## Solução Implementada

Adicionado tratamento de erro P2002 no webhook receiver:

```javascript
// 🛡️ Criar mensagem com proteção contra duplicatas
let message;
try {
  message = await prisma.message.create({
    data: {
      messageId: messageId,
      conversationId: conversation.id,
      fromMe,
      body: messageContent,
      type: 'text',
      timestamp: new Date(messageData.messageTimestamp * 1000)
    }
  });
  console.log(`✅ [${instanceId}] Mensagem salva: ${message.id}`);
} catch (error) {
  if (error.code === 'P2002' && error.meta?.target?.includes('messageId')) {
    console.log(`⚠️ [${instanceId}] Mensagem ${messageId} já existe, ignorando duplicata...`);
    // Buscar mensagem existente
    message = await prisma.message.findFirst({
      where: { messageId: messageId }
    });
    if (!message) {
      throw error; // Se não encontrar, re-lançar erro original
    }
  } else {
    throw error; // Re-lançar outros erros
  }
}
```

## 📦 Deploy no Easypanel

### Opção 1: Via Git (Recomendado)

Se você tiver o webhook receiver conectado via Git:

1. Commit e push das mudanças:
```bash
cd webhook-deploy
git add index.js
git commit -m "fix: add duplicate message handling"
git push
```

2. No Easypanel, clique em **Redeploy** no serviço do webhook

### Opção 2: Via Upload ZIP

Se você faz upload manual:

1. Compactar a pasta `webhook-deploy`:
```powershell
cd C:\Users\rafae\Downloads\WhatsAI2
Compress-Archive -Path webhook-deploy\* -DestinationPath webhook-receiver-fixed.zip -Force
```

2. No Easypanel:
   - Acesse seu app webhook receiver
   - Vá em **Settings** → **Source**
   - Faça upload do novo ZIP
   - Clique em **Deploy**

### Opção 3: Via Docker

Se você usa Docker:

```bash
cd webhook-deploy
docker build -t whatsai-webhook:latest .
docker tag whatsai-webhook:latest your-registry/whatsai-webhook:latest
docker push your-registry/whatsai-webhook:latest
```

## 🧪 Teste Pós-Deploy

Após o redeploy, os logs devem mostrar:

**ANTES (com erro):**
```
💬 [whatsai_...] Processando mensagem: York fêmea quem tem???
❌ Erro ao processar webhook [...]: Unique constraint failed on the fields: (`messageId`)
```

**DEPOIS (corrigido):**
```
💬 [whatsai_...] Processando mensagem: York fêmea quem tem???
⚠️ [whatsai_...] Mensagem AC610EDE1ACED94894297109E704E84E já existe, ignorando duplicata...
✅ [whatsai_...] Webhook processado com sucesso
```

## 📊 Observações dos Webhooks Atuais

Durante a análise, identifiquei que os webhooks estão chegando corretamente:

✅ **messages.upsert** - Mensagens entrando normalmente
✅ **messages.update** - Status updates (DELIVERY_ACK, READ) com device IDs
✅ **contacts.update** - Fotos e nomes chegando automaticamente:
   ```json
   {
     "remoteJid": "554198773200@s.whatsapp.net",
     "pushName": "",
     "profilePicUrl": "https://pps.whatsapp.net/v/t61.24694-24/..."
   }
   ```
✅ **chats.upsert** - Contador de não lidas sincronizado
✅ **presence.update** - Status de digitação (composing/available)

## 🎯 Próximos Passos

Depois do redeploy do webhook receiver:

1. **Testar mensagens duplicadas** - Enviar mensagem em grupo e verificar se não gera mais erro
2. **Validar @lid resolution** - Enviar mensagem da Flávia e verificar se cria apenas 1 conversa
3. **Confirmar fotos/nomes** - Verificar se contacts.update está populando automaticamente
4. **Verificar device IDs** - Confirmar normalização de `:4` e `:98`

## 📝 Checklist de Deploy

- [ ] Arquivo `index.js` atualizado com tratamento de duplicatas
- [ ] ZIP gerado com código atualizado
- [ ] Upload feito no Easypanel
- [ ] Deploy iniciado
- [ ] Logs verificados (não deve ter mais erro P2002)
- [ ] Teste com mensagem duplicada (grupo)
- [ ] Confirmado que mensagens são salvas sem erro

## 🔗 Arquivos Modificados

- `webhook-deploy/index.js` - Adicionado try-catch com P2002 handling (linha 86)

## 🐛 Bug Report

**Mensagem Duplicada Identificada:**
- MessageID: `AC610EDE1ACED94894297109E704E84E`
- Conteúdo: "York fêmea quem tem???"
- Grupo: `120363367622419821@g.us`
- Participante: `161443659960549@lid`
- Repetições: 8+ vezes no log

Este tipo de duplicata é esperado em grupos e agora está sendo tratado corretamente.
