# 📋 GUIA DE COMANDOS TESTADOS - WhatsAI2

## ✅ COMANDOS QUE FUNCIONARAM (USE ESTES!)

### 1. Teste de Webhook com Instância Válida
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/webhooks/evolution/whatsai_cd62f330_1abb_47c8_a4c0_73d21b9a8fc6" -Method POST -ContentType "application/json" -InFile "c:\Users\rafae\Downloads\WhatsAI2\test-group-webhook.json"
```
- **Resultado:** `{"success":true,"message":"Webhook processed successfully"}`
- **Quando usar:** Para testar webhooks com instâncias que existem no banco

### 2. Verificar Instâncias no Banco
```bash
cd c:\Users\rafae\Downloads\WhatsAI2\server; npx tsx scripts/check-instances.ts
```
- **Resultado:** Lista todas as instâncias WhatsApp com detalhes completos
- **Quando usar:** Para ver quais instâncias existem no sistema

### 3. Verificar Conversa Específica
```bash
cd c:\Users\rafae\Downloads\WhatsAI2\server; npx tsx scripts/check-group.ts
```
- **Resultado:** Mostra dados completos da conversa (nome, foto, status, etc.)
- **Quando usar:** Para verificar se uma conversa/grupo existe e seus dados atuais

### 4. Resetar Nome de Grupo (Para Testes)
```bash
cd c:\Users\rafae\Downloads\WhatsAI2\server; npx tsx scripts/reset-group-name.ts
```
- **Resultado:** Reseta contactName para null, forçando re-busca automática
- **Quando usar:** Para testar a funcionalidade de busca automática de nomes

### 5. Verificar se Servidor Está Rodando
```powershell
Invoke-WebRequest -Uri "http://localhost:3000" -Method GET | Select-Object -ExpandProperty StatusCode
```
- **Resultado:** `200` se servidor estiver rodando
- **Quando usar:** Para verificar status do servidor antes de testes

## ❌ COMANDOS QUE FALHARAM TOTALMENTE (EVITE ESTES!)

### 1. Acesso Direto ao Prisma no Terminal
```bash
npx tsx -e "import { PrismaClient } from '@prisma/client'; const prisma = new PrismaClient(); const contacts = await prisma.contact.findMany({ where: { jid: '120363129197033819@g.us' } }); console.log('Contacts found:', contacts); await prisma.\$disconnect();"
```
- **Erro:** `Syntax error "("` - Não consegue executar código assíncrono diretamente
- **Por que falha:** tsx não consegue parsear código complexo com async/await
- **Solução:** Crie um arquivo .ts separado e execute com `npx tsx arquivo.ts`

### 2. Verificar Logs do Servidor (Sintaxe PowerShell)
```powershell
Get-Content ../logs/server.log -Tail 50 2>$null || echo "No server log found"
```
- **Erro:** `InvalidEndOfLine` - Operador `||` não funciona no PowerShell
- **Solução:** Use `try/catch` ou comandos separados

### 3. Verificar Logs do Servidor (Arquivo Não Existe)
```powershell
try { Get-Content ../logs/server.log -Tail 50 } catch { "No server log found" }
```
- **Erro:** Arquivo `../logs/server.log` não existe
- **Por que:** O servidor não gera arquivo de log separado, usa console.log

### 4. Webhook com Instância Inexistente
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/webhooks/evolution/test-instance" -Method POST -ContentType "application/json" -InFile "c:\Users\rafae\Downloads\WhatsAI2\test-group-webhook.json"
```
- **Resultado:** `{"success":true,"message":"Webhook ignored - instance not found in database"}`
- **Por que falha:** Instância não existe no banco de dados
- **Solução:** Sempre use instâncias que existem (verifique com check-instances.ts)

### 5. Webhook com Grupo Inexistente na Evolution API
```powershell
# Usando JID de grupo que não existe: 999999999999999999@g.us
Invoke-WebRequest -Uri "http://localhost:3000/api/webhooks/evolution/whatsai_cd62f330_1abb_47c8_a4c0_73d21b9a8fc6" -Method POST -ContentType "application/json" -InFile "c:\Users\rafae\Downloads\WhatsAI2\test-group-webhook.json"
```
- **Resultado:** Webhook "processado" mas conversa não criada
- **Por que falha:** Grupo não existe na conta WhatsApp conectada
- **Solução:** Use apenas JIDs de grupos que realmente existem na Evolution API

## 🗄️ ACESSOS AO BANCO QUE FUNCIONARAM

### 1. SELECT Simples
```typescript
// ✅ FUNCIONA: Buscar primeira conversa
const conv = await prisma.conversation.findFirst();

// ✅ FUNCIONA: Buscar com WHERE
const groups = await prisma.conversation.findMany({
  where: { isGroup: true },
  take: 2
});

// ✅ FUNCIONA: Buscar com JOIN
const convWithInstance = await prisma.conversation.findFirst({
  include: { instance: true }
});

// ✅ FUNCIONA: COUNT
const count = await prisma.conversation.count();

// ✅ FUNCIONA: ORDER BY e LIMIT
const recent = await prisma.conversation.findMany({
  orderBy: { lastMessageAt: 'desc' },
  take: 3
});
```

### 2. INSERT, UPDATE, DELETE
```typescript
// ✅ FUNCIONA: INSERT
const testConv = await prisma.conversation.create({
  data: {
    instanceId: 'cmh73gobi0001vr6waqem8syp',
    remoteJid: 'test@test.com',
    contactName: 'Test Contact',
    isGroup: false,
    lastMessage: 'Test message',
    lastMessageAt: new Date(),
    unreadCount: 0
  }
});

// ✅ FUNCIONA: UPDATE
const updateResult = await prisma.conversation.update({
  where: { id: testConv.id },
  data: { contactName: 'Updated Test Contact' }
});

// ✅ FUNCIONA: DELETE
const deleteResult = await prisma.conversation.delete({
  where: { id: testConv.id }
});

// ✅ FUNCIONA: UPDATE em massa
const bulkUpdate = await prisma.conversation.updateMany({
  where: { contactName: null },
  data: { contactName: 'Unknown Contact' }
});
```

### 3. Queries Avançadas
```typescript
// ✅ FUNCIONA: GROUP BY
const groupByType = await prisma.conversation.groupBy({
  by: ['isGroup'],
  _count: { isGroup: true }
});

// ✅ FUNCIONA: Subqueries
const convsWithMessages = await prisma.conversation.findMany({
  where: {
    messages: { some: {} }
  },
  take: 3
});

// ✅ FUNCIONA: LIKE search
const likeResults = await prisma.conversation.findMany({
  where: {
    contactName: { contains: 'Test' }
  }
});

// ✅ FUNCIONA: OR conditions
const orResults = await prisma.conversation.findMany({
  where: {
    OR: [
      { isGroup: true },
      { unreadCount: { gt: 0 } }
    ]
  }
});

// ✅ FUNCIONA: DISTINCT
const distinctInstances = await prisma.conversation.findMany({
  select: { instanceId: true },
  distinct: ['instanceId']
});

// ✅ FUNCIONA: Funções agregadas (MAX)
const maxDate = await prisma.conversation.aggregate({
  _max: { lastMessageAt: true }
});
```

### 4. Transações e Queries Complexas
```typescript
// ✅ FUNCIONA: Transações
const result = await prisma.$transaction(async (tx) => {
  const testConv = await tx.conversation.create({...});
  await tx.conversation.delete({ where: { id: testConv.id } });
  return 'Transação executada';
});

// ✅ FUNCIONA: Raw SQL
const rawResult = await prisma.$queryRaw`SELECT COUNT(*) as total FROM conversations`;

// ✅ FUNCIONA: Paginação
const page1 = await prisma.conversation.findMany({
  skip: 0, take: 3, orderBy: { createdAt: 'desc' }
});

// ✅ FUNCIONA: Múltiplos includes
const convWithRelations = await prisma.conversation.findFirst({
  include: {
    instance: true,
    messages: { take: 2, orderBy: { timestamp: 'desc' } }
  }
});

// ✅ FUNCIONA: Batch operations
const [count, firstConv, groups] = await Promise.all([
  prisma.conversation.count(),
  prisma.conversation.findFirst(),
  prisma.conversation.findMany({ where: { isGroup: true }, take: 2 })
]);

// ✅ FUNCIONA: Filtros complexos (AND + OR + NOT)
const complexResults = await prisma.conversation.findMany({
  where: {
    AND: [
      { isGroup: false },
      {
        OR: [
          { contactName: { not: null } },
          { nickname: { not: null } }
        ]
      }
    ]
  }
});
```

## 🚫 ACESSOS AO BANCO QUE NÃO FUNCIONAM

### 1. Tabela `contact` Não Existe
```typescript
// ❌ NÃO FUNCIONA: Tabela não existe
const contacts = await prisma.contact.findMany({...});
// Erro: Property 'contact' does not exist on type 'PrismaClient'
```

### 2. UPSERT com remoteJid (não é chave única)
```typescript
// ❌ NÃO FUNCIONA: remoteJid não é único
const upsertResult = await prisma.conversation.upsert({
  where: { remoteJid: 'test@test.com' }, // ❌ Inválido
  update: { lastMessage: 'Updated' },
  create: { /* ... */ }
});
// Erro: remoteJid não é chave única
```

### 3. Campos obrigatórios faltando
```typescript
// ❌ NÃO FUNCIONA: instanceId obrigatório faltando
const invalidConv = await prisma.conversation.create({
  data: {
    remoteJid: 'test@test.com',
    contactName: 'Test',
    isGroup: false
    // Faltando instanceId
  }
});
// Erro: instanceId is missing
```

### 4. Unique constraint violations
```typescript
// ❌ NÃO FUNCIONA: Violação de unicidade
// Se já existe uma conversa com mesmo instanceId + remoteJid
const duplicate = await prisma.conversation.create({
  data: {
    instanceId: 'existing-instance',
    remoteJid: 'existing@test.com', // Já existe
    // ...
  }
});
// Erro: Unique constraint failed on the fields: (`instanceId`,`remoteJid`)
```

### 5. Tipos de dados inválidos
```typescript
// ❌ NÃO FUNCIONA: Tipo errado
const invalidType = await prisma.conversation.create({
  data: {
    // ...
    unreadCount: 'not-a-number' // Deve ser Int
  }
});
// Erro: Expected Int, provided String
```

### 6. Operadores inválidos
```typescript
// ❌ NÃO FUNCIONA: Operador inexistente
const invalidQuery = await prisma.conversation.findMany({
  where: {
    invalidOperator: { nonexistent: true } // ❌ Não existe
  }
});
// Erro: Unknown argument `invalidOperator`
```

### 7. Acesso a propriedades inexistentes
```typescript
// ❌ NÃO FUNCIONA: Propriedade não existe
const nonexistent = await prisma.nonExistentTable.findMany();
// Erro: Cannot read properties of undefined (reading 'findMany')
```

## 📊 ESTRUTURA DO BANCO E CONSTRAINTS

### Tabelas Disponíveis
- ✅ `conversation` - Conversas/contatos
- ✅ `whatsAppInstance` - Instâncias do WhatsApp
- ✅ `message` - Mensagens
- ✅ `webhookEvent` - Eventos de webhook
- ✅ `user` - Usuários
- ✅ `userSettings` - Configurações do usuário

### Constraints Importantes
- **Conversation**: `instanceId` + `remoteJid` = UNIQUE
- **Message**: `messageId` = UNIQUE
- **WhatsAppInstance**: `evolutionInstanceName` = UNIQUE
- **Campos obrigatórios**: `instanceId` (conversation), `instanceId` + `remoteJid` (conversation)

### Chaves Únicas Válidas para WHERE
```typescript
// ✅ Conversation - usar ID
where: { id: 'conversation-id' }

// ✅ Conversation - usar compound unique
where: {
  instanceId_remoteJid: {
    instanceId: 'instance-id',
    remoteJid: 'remote@jid.com'
  }
}

// ✅ WhatsAppInstance
where: { evolutionInstanceName: 'instance-name' }

// ✅ Message
where: { messageId: 'message-id' }
```

---
*Última atualização: Outubro 2025*
*Testado no ambiente WhatsAI2 com PostgreSQL + Prisma*

## 🚫 ACESSOS AO BANCO QUE NÃO EXISTEM

### 1. Tabela `contact` Não Existe
```typescript
// ❌ NÃO FUNCIONA
const contacts = await prisma.contact.findMany({...});
```
- **Erro:** `Property 'contact' does not exist on type 'PrismaClient'`
- **Correto:** Use `conversation` para dados de contato

## ⚠️ PROBLEMAS DESCOBERTOS DURANTE TESTES

### 1. Conversas Duplicadas Criadas Durante Testes
**Sintomas:** Dois números similares criados:
- `554198773200@s.whatsapp.net` (Contato Original, 0 mensagens)  
- `5541998773200@s.whatsapp.net` (554198773200, 5 mensagens)

**Impacto:** Pode causar confusão na busca de mensagens e contatos
**Solução:** Verificar e limpar conversas duplicadas antes de testes em produção

### 2. Webhook contacts.update Não Aparece nos Logs
**Sintomas:** Webhook retorna sucesso mas função updateContactFromWebhook não é executada
**Possível causa:** Servidor pode não estar recarregando código corretamente com tsx watch
**Solução:** Verificar se servidor está usando código atualizado

## 📝 NOTAS IMPORTANTES

- Sempre verifique se não há conversas duplicadas após testes
- Use apenas comandos marcados como ✅ "FUNCIONARAM"
- Evite comandos marcados como ❌ "FALHARAM TOTALMENTE"

---
*Última atualização: Outubro 2025*
*Testado no ambiente WhatsAI2 com Evolution API*