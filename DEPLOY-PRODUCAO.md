# 🚀 Deploy das Correções para Produção (Easypanel)

## ⚠️ SITUAÇÃO ATUAL

As correções de **busca automática de nome de grupos** estão apenas **LOCALMENTE**.

Para funcionar em produção no Easypanel, você precisa fazer deploy do código atualizado.

---

## 📦 ARQUIVOS MODIFICADOS (que precisam ir para produção)

### 1. `server/src/services/conversation-service.ts`
**Mudança**: Busca nome do grupo via Evolution API ANTES de criar conversa
```typescript
// ✅ NOVO: Busca info do grupo antes da transação
if (isGroupConversation && instance.evolutionInstanceName) {
  groupInfo = await evolutionService.findGroupByJid(instanceName, remoteJid);
}
```

### 2. `server/src/api/controllers/webhook-controller.ts`
**Mudança**: Removida lógica duplicada de busca de grupo
```typescript
// ✅ NOVO: Apenas chama handleIncomingMessageAtomic
// (que já faz a busca do grupo internamente)
await this.conversationService.handleIncomingMessageAtomic(instanceId, validated.data.data);
```

### 3. `server/src/services/conversation-service.ts` (updateContactFromWebhook)
**Mudança**: Não sobrescreve nome de grupo com pushName
```typescript
// ✅ NOVO: Ignora contactName para grupos
if (!isGroupContact && data.contactName) {
  updateData.contactName = data.contactName;
}
```

---

## 🎯 PASSO A PASSO PARA DEPLOY

### Opção A: Deploy via Git (RECOMENDADO)

```bash
# 1. Abrir terminal na pasta do projeto
cd /Users/desenvolvimentomobile/rafa/WhatsAI2

# 2. Verificar status das mudanças
git status

# 3. Adicionar todos os arquivos modificados
git add .

# 4. Fazer commit com mensagem descritiva
git commit -m "fix: buscar nome de grupos automaticamente via Evolution API

- Detecta @g.us e busca groupInfo antes de criar conversa
- Usa groupInfo.subject como contactName para grupos
- Nunca usa pushName como nome de grupo
- Protege contra sobrescrever nome existente
- Emite WebSocket com conversa completa
- Fix: Frontend atualiza automaticamente sem F5"

# 5. Enviar para GitHub
git push origin main
```

### Opção B: Forçar Rebuild no Easypanel (se não tiver auto-deploy)

1. Acesse: http://143.198.230.247:3000/
2. Vá no projeto `whatsai-backend` (ou `teta-webhook`)
3. Clique no serviço `whatsai-api`
4. Clique em **"Rebuild"** ou **"Redeploy"**
5. Aguarde o build terminar (vai puxar o código do GitHub)

---

## ✅ COMO VERIFICAR SE FUNCIONOU

### 1. Verificar Build no Easypanel

```
Acesse: http://143.198.230.247:3000/
→ Projeto: whatsai-backend
→ Service: whatsai-api
→ Aba "Logs"

Procure por:
✅ "Build succeeded"
✅ "Server running on port 3001"
✅ "Database connected"
```

### 2. Testar Webhook

```bash
# Enviar uma mensagem em um GRUPO no WhatsApp conectado

# Verificar nos logs do Easypanel se aparece:
👥 [GROUP_INFO] Buscando informações do grupo...
✅ [GROUP_INFO] Nome do grupo encontrado: "Nome Real Do Grupo"
✅ [CONVERSATION_CREATED] Grupo: 120363404043393161@g.us
📡 [EMIT_WEBSOCKET] Emitindo conversation:updated...
```

### 3. Verificar no Frontend

```
1. Abrir WhatsAI no navegador
2. NÃO apertar F5
3. Enviar mensagem em um grupo
4. Verificar se:
   ✅ Conversa aparece automaticamente
   ✅ Nome correto do grupo aparece
   ✅ Não precisa dar F5
```

---

## 🗄️ LIMPAR GRUPOS NO BANCO DE PRODUÇÃO

Se quiser testar com grupos novos (sem nome antigo), execute no banco de **produção**:

```sql
-- Conectar no PostgreSQL de produção:
-- Host: aws-1-us-east-1.pooler.supabase.com
-- User: postgres.viqjmhlxsqqoqimglxar
-- Password: xitao3275rafa
-- Database: postgres

UPDATE "Conversation"
SET "contactName" = NULL, "contactPicture" = NULL
WHERE "isGroup" = true;
```

**OU** via script TypeScript:

```typescript
// Criar arquivo: server/scripts/reset-production-groups.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasourceUrl: 'postgresql://postgres.viqjmhlxsqqoqimglxar:xitao3275rafa@aws-1-us-east-1.pooler.supabase.com:5432/postgres'
});

async function main() {
  const result = await prisma.conversation.updateMany({
    where: { isGroup: true },
    data: { contactName: null, contactPicture: null }
  });
  
  console.log(`✅ ${result.count} grupos resetados em produção`);
}

main().finally(() => prisma.$disconnect());
```

---

## 📊 CHECKLIST DE DEPLOY

- [ ] Código commitado no Git
- [ ] Push para GitHub feito (`git push origin main`)
- [ ] Easypanel fez rebuild automático OU rebuild manual
- [ ] Logs do Easypanel mostram "Build succeeded"
- [ ] Servidor reiniciou sem erros
- [ ] Webhook recebendo eventos (verificar logs)
- [ ] Teste: Enviar mensagem em grupo
- [ ] Nome do grupo aparece corretamente
- [ ] Frontend atualiza sem F5
- [ ] WebSocket funcionando (console do browser mostra eventos)

---

## 🐛 TROUBLESHOOTING

### Problema: Build falhou no Easypanel

**Solução**:
```bash
# Verificar se package.json está correto
# Verificar se todas as dependências estão instaladas
# Ver logs de erro no Easypanel
```

### Problema: Nome de grupo ainda não aparece

**Possíveis causas**:
1. Código antigo ainda rodando (não fez rebuild)
2. Cache do navegador (Ctrl+Shift+R para hard reload)
3. Evolution API não retornando groupInfo
4. Instância não conectada no Evolution

**Verificar**:
```bash
# No Easypanel, ver logs:
👥 [GROUP_INFO] Buscando informações do grupo...

# Se aparecer erro aqui, Evolution API não está respondendo
```

### Problema: Frontend não atualiza automaticamente

**Verificar**:
1. WebSocket conectado? (Console do browser: `🔌 Socket conectado`)
2. Evento sendo emitido? (Logs: `📡 [EMIT_WEBSOCKET]`)
3. Frontend escutando? (Console: `🔔 [ConversationList] RECEBEU EVENTO`)

---

## 📝 RESUMO

Para colocar em produção:

```bash
git add .
git commit -m "fix: buscar nome de grupos via Evolution API"
git push origin main
```

Depois:
1. Aguardar rebuild no Easypanel
2. Testar enviando mensagem em grupo
3. Verificar se nome aparece automaticamente
4. ✅ Pronto!

---

**Última Atualização**: 30 de Outubro de 2025
