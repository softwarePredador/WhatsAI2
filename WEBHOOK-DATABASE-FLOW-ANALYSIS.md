# Análise Profunda: Fluxo de Dados Webhook → Prisma → Frontend

## 🔍 PROBLEMAS CRÍTICOS IDENTIFICADOS

### ❌ PROBLEMA 1: MessageRepository.update() não atualiza STATUS

**Localização:** `server/src/database/repositories/message-repository.ts`

**Código atual:**
```typescript
export interface UpdateMessageData {
  content?: string;
  mediaUrl?: string;
  fileName?: string;
  caption?: string;
  // ❌ FALTA: status?: string;
}

async update(id: string, data: UpdateMessageData): Promise<Message> {
  return this.prisma.message.update({
    where: { id },
    data: {
      ...data,
      updatedAt: new Date()
    }
  });
}
```

**Problema:**
- Interface `UpdateMessageData` NÃO inclui campo `status`
- Mas `handleMessageStatusUpdate` tenta atualizar status diretamente via Prisma
- **Inconsistência:** Usa Prisma direto em vez de usar o repository

**Impacto:**
- ⚠️ Repository não pode atualizar status
- ⚠️ Bypass do repository pattern
- ⚠️ Código inconsistente

---

### ❌ PROBLEMA 2: Status não é incluído ao buscar mensagens

**Localização:** `server/src/database/repositories/message-repository.ts`

**Código atual:**
```typescript
type Message = {
  id: string;
  instanceId: string;
  remoteJid: string;
  fromMe: boolean;
  messageType: string;
  content: string;
  mediaUrl?: string | null;
  fileName?: string | null;
  caption?: string | null;
  messageId: string;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
  conversationId?: string | null;
  // ❌ FALTA: status?: string | null;
}
```

**Problema:**
- Type `Message` NÃO inclui campo `status`
- Mas schema Prisma TEM campo `status`
- Quando busca mensagens do banco, status é retornado mas não está no tipo

**Impacto:**
- ⚠️ TypeScript não valida campo status
- ⚠️ Pode causar bugs silenciosos
- ⚠️ Frontend recebe status mas não está tipado

---

### ❌ PROBLEMA 3: Conversas duplicadas por normalização inconsistente

**Localização:** `server/src/services/conversation-service.ts`

**Fluxo atual:**
```typescript
// 1. Webhook recebe: "5511999999999@s.whatsapp.net"
let remoteJid = messageData.key.remoteJid;

// 2. Verifica remoteJidAlt (pode mudar remoteJid)
if (messageData.key.remoteJidAlt && !messageData.key.remoteJidAlt.includes('@lid')) {
  remoteJid = messageData.key.remoteJidAlt;
}

// 3. Normaliza número brasileiro (pode adicionar 9)
if (remoteJid.startsWith('55') && cleanNumber.length === 12) {
  remoteJid = `55${ddd}9${phoneNumber}@s.whatsapp.net`;
}

// 4. Resolve @lid (pode mudar remoteJid de novo)
remoteJid = this.resolveLidToRealNumber(remoteJid);

// 5. Normaliza formato
const normalizedRemoteJid = this.normalizeRemoteJid(remoteJid);
const formattedRemoteJid = this.formatRemoteJid(normalizedRemoteJid);
```

**Problema:**
- **MUITAS transformações em sequência**
- Cada transformação pode sobrescrever a anterior
- Ordem importa mas não está clara
- `remoteJidAlt` pode ter @lid ou número real
- Se webhook enviar dados inconsistentes, cria conversas duplicadas

**Cenário de duplicação:**
```
Mensagem 1:
  remoteJid: "5511999999999@s.whatsapp.net"
  remoteJidAlt: null
  → Salva como: "5511999999999@s.whatsapp.net"

Mensagem 2 (mesmo contato):
  remoteJid: "123456@lid"
  remoteJidAlt: "5511999999999@s.whatsapp.net"
  → Salva como: "5511999999999@s.whatsapp.net"

Mensagem 3 (número sem 9):
  remoteJid: "551199999999@s.whatsapp.net" (sem 9)
  remoteJidAlt: null
  → Adiciona 9: "5511999999999@s.whatsapp.net"
  
✅ Nestes casos funciona!

Mas se:
Mensagem 4 (ordem diferente):
  remoteJid: "123456@lid"
  remoteJidAlt: null (API não enviou)
  → Fica como: "123456@lid"
  → ❌ CONVERSA DUPLICADA!
```

**Impacto:**
- ⚠️ Risco de conversas duplicadas
- ⚠️ Mensagens espalhadas entre múltiplas conversas
- ⚠️ Dependência total de remoteJidAlt estar sempre presente

---

### ❌ PROBLEMA 4: conversationId pode estar NULL

**Localização:** Schema Prisma + Message Repository

**Schema atual:**
```prisma
model Message {
  // ...
  conversation   Conversation?    @relation(fields: [conversationId], references: [id])
  conversationId String?  // ⚠️ OPCIONAL
  // ...
}
```

**Problema:**
- `conversationId` é OPCIONAL no schema
- Mas código sempre cria conversa ANTES de salvar mensagem
- Se falhar ao criar conversa, mensagem fica "órfã"
- Mensagens órfãs não aparecem em nenhuma conversa

**Cenário:**
```typescript
// 1. Tentar criar conversa
const conversation = await this.createOrUpdateConversation(...);

// 2. Se createOrUpdateConversation FALHAR (erro de rede, timeout, etc)
// conversation = undefined OU throw error

// 3. Se continuar execução sem conversation:
const messageCreateData = {
  // ...
  conversationId: conversation?.id // ❌ PODE SER UNDEFINED
};

// 4. Mensagem salva SEM conversationId
// ❌ MENSAGEM ÓRFÃ!
```

**Impacto:**
- ⚠️ Mensagens podem ficar sem conversa
- ⚠️ Impossível recuperar mensagens órfãs no frontend
- ⚠️ Dados inconsistentes

---

### ❌ PROBLEMA 5: handleMessageStatusUpdate usa Prisma direto

**Localização:** `server/src/services/conversation-service.ts`

**Código atual:**
```typescript
async handleMessageStatusUpdate(instanceId: string, data: {...}): Promise<void> {
  // ❌ Usa Prisma diretamente
  const message = await prisma.message.findUnique({
    where: { messageId: data.messageId }
  });

  // ❌ Usa Prisma diretamente de novo
  await prisma.message.update({
    where: { id: message.id },
    data: { status: normalizedStatus }
  });
}
```

**Deveria usar:**
```typescript
// ✅ Usar repository
const message = await this.messageRepository.findByMessageId(data.messageId);

// ✅ Usar repository
await this.messageRepository.update(message.id, {
  status: normalizedStatus
});
```

**Problema:**
- **Quebra Repository Pattern**
- MessageRepository existe mas não é usado
- Lógica de negócio misturada com acesso a dados

**Impacto:**
- ⚠️ Código difícil de testar (mock do Prisma é complicado)
- ⚠️ Sem validações do repository
- ⚠️ Inconsistência arquitetural

---

## 🔍 FLUXO ATUAL COMPLETO

### 📥 Fluxo 1: Recebimento de Mensagem (MESSAGES_UPSERT)

```
┌─────────────────────────────────────────────────────┐
│ 1. Evolution API envia webhook                      │
│    POST /api/webhooks/evolution/:instanceId         │
│    {                                                  │
│      event: "messages.upsert",                      │
│      data: {                                         │
│        key: {                                        │
│          remoteJid: "5511999999999@s.whatsapp.net",│
│          remoteJidAlt: "...",                       │
│          fromMe: false,                              │
│          id: "3EB0XXXXX"                            │
│        },                                            │
│        message: { conversation: "Oi" },             │
│        messageTimestamp: 1729900000,                │
│        pushName: "João Silva"                       │
│      }                                               │
│    }                                                 │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ 2. WebhookController.handleEvolutionWebhook()      │
│    - Valida com Zod                                 │
│    - Identifica event: "messages.upsert"           │
│    - Chama conversationService.handleIncomingMessage│
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ 3. ConversationService.handleIncomingMessage()     │
│    ⚠️ MUITAS TRANSFORMAÇÕES:                        │
│                                                      │
│    a) Buscar instância no banco                     │
│       const instance = await prisma.whatsAppInstance│
│         .findUnique({ evolutionInstanceName })      │
│                                                      │
│    b) Resolver remoteJid (4 passos):                │
│       - Verificar remoteJidAlt                      │
│       - Normalizar número brasileiro (+9)           │
│       - Resolver @lid                               │
│       - normalizeRemoteJid + formatRemoteJid        │
│                                                      │
│    c) Criar/atualizar conversa                      │
│       const conversation = await                    │
│         createOrUpdateConversation(...)             │
│       ⚠️ Se falhar aqui, mensagem fica órfã         │
│                                                      │
│    d) Salvar mensagem                               │
│       const message = await                         │
│         messageRepository.create({                  │
│           instanceId: instance.id,                  │
│           remoteJid: formattedRemoteJid,            │
│           fromMe: false,                             │
│           messageType: "TEXT",                      │
│           content: "Oi",                             │
│           messageId: "3EB0XXXXX",                   │
│           timestamp: new Date(...),                 │
│           status: "DELIVERED", // ✅ Status inicial │
│           conversationId: conversation.id           │
│         })                                           │
│       ⚠️ Usa UPSERT (pode atualizar existente)      │
│                                                      │
│    e) Atualizar unreadCount (lógica smart)          │
│       - Se fromMe OU conversation ativa → 0         │
│       - Senão → +1                                   │
│                                                      │
│    f) Emitir WebSocket                              │
│       - socketService.emitToInstance(              │
│           'message:received', {...}                 │
│         )                                            │
│       - socketService.emitToInstance(              │
│           'conversation:updated', {...}             │
│         )                                            │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ 4. Prisma salva no PostgreSQL                      │
│                                                      │
│    INSERT INTO messages (                           │
│      id, instanceId, remoteJid, fromMe,            │
│      messageType, content, messageId,               │
│      timestamp, status, conversationId,             │
│      createdAt, updatedAt                           │
│    ) VALUES (...)                                    │
│    ON CONFLICT (messageId)                          │
│      DO UPDATE SET content=..., updatedAt=...      │
│                                                      │
│    UPDATE conversations                             │
│      SET lastMessage=..., lastMessageAt=...,       │
│          unreadCount=..., updatedAt=...             │
│      WHERE id=...                                    │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ 5. Frontend recebe via WebSocket                   │
│    - Event: "message:received"                      │
│    - Adiciona mensagem no estado                    │
│    - Atualiza UI                                     │
│                                                      │
│    - Event: "conversation:updated"                  │
│    - Atualiza lista de conversas                    │
│    - Atualiza badge de não lidas                    │
└─────────────────────────────────────────────────────┘
```

---

### 📤 Fluxo 2: Envio de Mensagem (sendMessage)

```
┌─────────────────────────────────────────────────────┐
│ 1. Frontend envia requisição                        │
│    POST /api/conversations/:id/messages             │
│    { remoteJid: "...", content: "Olá" }            │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ 2. ConversationController.sendMessage()             │
│    - Busca conversationId                           │
│    - Chama conversationService.sendMessage()        │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ 3. ConversationService.sendMessage()                │
│                                                      │
│    a) Normalizar remoteJid                          │
│       normalizeRemoteJid + formatRemoteJid          │
│                                                      │
│    b) Buscar instância (select apenas campos needed)│
│       ✅ OTIMIZADO!                                  │
│                                                      │
│    c) ⚡ PARALELO: Enviar + Criar conversa          │
│       const [evolutionResponse, conversation] =     │
│         await Promise.all([                         │
│           evolutionApi.sendTextMessage(...),        │
│           createOrUpdateConversation(...)           │
│         ]);                                          │
│       ✅ OTIMIZAÇÃO: 87.5% mais rápido!             │
│                                                      │
│    d) Salvar mensagem no banco                      │
│       const message = await                         │
│         messageRepository.create({                  │
│           ...                                        │
│           status: 'SENT', // ✅ Status inicial      │
│           conversationId: conversation.id           │
│         })                                           │
│                                                      │
│    e) ⚡ Fire-and-forget: Update + Emit             │
│       Promise.all([                                 │
│         conversationRepository.update(...),         │
│         emitWebSocket(...)                          │
│       ]).catch(...)                                  │
│       ✅ Não bloqueia resposta ao frontend          │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ 4. Evolution API envia mensagem pelo WhatsApp      │
│    - Retorna messageId: "3EB0YYYYY"                │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ 5. Evolution API envia webhooks de status          │
│    - messages.update: status=PENDING                │
│    - messages.update: status=SERVER_ACK             │
│    - messages.update: status=DELIVERY_ACK           │
│    - messages.update: status=READ                   │
└─────────────────────────────────────────────────────┘
```

---

### 🔄 Fluxo 3: Atualização de Status (MESSAGES_UPDATE)

```
┌─────────────────────────────────────────────────────┐
│ 1. Evolution API envia webhook                      │
│    POST /api/webhooks/evolution/:instanceId         │
│    {                                                  │
│      event: "messages.update",                      │
│      data: [{                                        │
│        remoteJid: "5511999999999@s.whatsapp.net",  │
│        key: { id: "3EB0XXXXX" },                    │
│        status: "READ"                                │
│      }]                                              │
│    }                                                 │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ 2. WebhookController.handleEvolutionWebhook()      │
│    - Identifica event: "messages.update"           │
│    - Loop pelos updates (pode ser array)            │
│    - Mapeia @lid se necessário                      │
│    - Normaliza status:                              │
│        ERROR → FAILED                                │
│        PENDING → SENT                                │
│        SERVER_ACK → SENT                             │
│        DELIVERY_ACK → DELIVERED                      │
│        READ → READ                                   │
│        PLAYED → PLAYED                               │
│    - Chama conversationService.                     │
│        handleMessageStatusUpdate()                  │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ 3. ConversationService.handleMessageStatusUpdate() │
│    ⚠️ PROBLEMA: Usa Prisma direto                   │
│                                                      │
│    a) Buscar mensagem                               │
│       const message = await prisma.message          │
│         .findUnique({ where: { messageId } })       │
│       ❌ Deveria usar messageRepository             │
│                                                      │
│    b) Validar status                                │
│       validStatuses = ['PENDING', 'SENT', ...]      │
│                                                      │
│    c) Atualizar status                              │
│       await prisma.message.update({                 │
│         where: { id },                               │
│         data: { status: normalizedStatus }          │
│       })                                             │
│       ❌ Deveria usar messageRepository             │
│                                                      │
│    d) Emitir WebSocket                              │
│       socketService.emitToInstance(                │
│         'message:status', {                         │
│           messageId: message.id,                    │
│           status: normalizedStatus,                 │
│           conversationId: message.conversationId    │
│         }                                            │
│       )                                              │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ 4. Frontend recebe via WebSocket                   │
│    - Event: "message:status"                        │
│    - Atualiza status da mensagem                    │
│    - Atualiza checkmarks (✓ → ✓✓ → ✓✓ azul)       │
└─────────────────────────────────────────────────────┘
```

---

## 📊 ANÁLISE DE CONSISTÊNCIA DE DADOS

### ✅ O que está CORRETO

1. **Unique constraint em messageId** ✅
   ```prisma
   messageId String @unique
   ```
   - Previne duplicatas de mensagens
   - UPSERT funciona corretamente

2. **Cascade delete** ✅
   ```prisma
   instance WhatsAppInstance @relation(..., onDelete: Cascade)
   ```
   - Quando instância é deletada, mensagens são deletadas
   - Dados não ficam órfãos

3. **Índices de performance** ✅
   ```prisma
   @@index([instanceId])
   @@index([conversationId, timestamp(sort: Desc)])
   @@index([remoteJid])
   ```
   - Queries rápidas
   - Ordenação otimizada

4. **Status inicial correto** ✅
   - Mensagens recebidas: `DELIVERED`
   - Mensagens enviadas: `SENT`
   - Atualizadas via webhook

5. **Smart unread logic** ✅
   - Se conversa ativa → não incrementa
   - Se fromMe → não incrementa
   - Senão → +1

---

### ❌ O que está ERRADO

1. **MessageRepository incompleto** ❌
   - Interface não tem `status`
   - Type Message não tem `status`
   - update() não pode atualizar status

2. **Repository Pattern quebrado** ❌
   - handleMessageStatusUpdate usa Prisma direto
   - Inconsistência arquitetural

3. **conversationId opcional** ❌
   - Schema permite NULL
   - Mas código assume que sempre existe
   - Risco de mensagens órfãs

4. **Normalização complexa** ❌
   - Múltiplas transformações em sequência
   - Ordem importa mas não está clara
   - Risco de conversas duplicadas

5. **Sem rollback em caso de erro** ❌
   - Se salvar mensagem mas falhar ao emitir WebSocket
   - Frontend não atualiza mas banco sim
   - Dados inconsistentes

---

## 🎯 CORREÇÕES RECOMENDADAS

### 1. CORRIGIR MessageRepository (ALTA PRIORIDADE)

```typescript
// message-repository.ts

type Message = {
  id: string;
  instanceId: string;
  remoteJid: string;
  fromMe: boolean;
  messageType: string;
  content: string;
  mediaUrl?: string | null;
  fileName?: string | null;
  caption?: string | null;
  messageId: string;
  timestamp: Date;
  status?: string | null; // ✅ ADICIONAR
  createdAt: Date;
  updatedAt: Date;
  conversationId?: string | null;
};

export interface UpdateMessageData {
  content?: string;
  mediaUrl?: string;
  fileName?: string;
  caption?: string;
  status?: string; // ✅ ADICIONAR
}
```

### 2. USAR Repository em handleMessageStatusUpdate

```typescript
// conversation-service.ts

async handleMessageStatusUpdate(instanceId: string, data: {
  messageId: string;
  status: string;
  remoteJid?: string;
}): Promise<void> {
  try {
    // ✅ Usar repository
    const message = await this.messageRepository.findByMessageId(data.messageId);

    if (!message) {
      console.log('⚠️ Message not found:', data.messageId);
      return;
    }

    const validStatuses = ['PENDING', 'SENT', 'DELIVERED', 'READ', 'PLAYED', 'FAILED'];
    const normalizedStatus = data.status.toUpperCase();
    
    if (!validStatuses.includes(normalizedStatus)) {
      console.log('⚠️ Invalid status:', data.status);
      return;
    }

    // ✅ Usar repository
    await this.messageRepository.update(message.id, {
      status: normalizedStatus
    });

    console.log('✅ Status updated:', data.messageId, '→', normalizedStatus);

    this.socketService.emitToInstance(instanceId, 'message:status', {
      messageId: message.id,
      whatsappMessageId: data.messageId,
      status: normalizedStatus,
      conversationId: message.conversationId
    });

  } catch (error) {
    console.error('❌ Error updating message status:', error);
    throw error;
  }
}
```

### 3. TORNAR conversationId OBRIGATÓRIO

```prisma
model Message {
  // ...
  
  // ✅ Tornar obrigatório
  conversation   Conversation @relation(fields: [conversationId], references: [id])
  conversationId String
  
  // ...
}
```

**Migration necessária:**
```sql
-- 1. Deletar mensagens órfãs (se existirem)
DELETE FROM messages WHERE conversationId IS NULL;

-- 2. Tornar coluna NOT NULL
ALTER TABLE messages ALTER COLUMN conversationId SET NOT NULL;
```

### 4. SIMPLIFICAR Normalização de remoteJid

```typescript
// Criar método único e claro
private normalizeWhatsAppNumber(raw: string, alt?: string): string {
  console.log('🔄 Normalizando:', { raw, alt });
  
  // PRIORIDADE 1: Se alt existe e NÃO é @lid, usar alt
  if (alt && !alt.includes('@lid')) {
    console.log('✅ Usando remoteJidAlt:', alt);
    return this.formatRemoteJid(alt);
  }
  
  // PRIORIDADE 2: Se raw é @lid e temos cache, usar cache
  if (raw.includes('@lid')) {
    const cached = this.lidToRealNumberCache.get(raw);
    if (cached) {
      console.log('✅ Usando cache @lid:', cached);
      return this.formatRemoteJid(cached);
    }
    console.log('⚠️ @lid sem mapeamento:', raw);
    return raw; // Manter @lid se não tiver como resolver
  }
  
  // PRIORIDADE 3: Normalizar número brasileiro
  let normalized = raw;
  if (normalized.includes('@s.whatsapp.net')) {
    const number = normalized.replace('@s.whatsapp.net', '');
    if (number.startsWith('55') && number.length === 12) {
      // Adicionar 9
      const ddd = number.substring(2, 4);
      const phone = number.substring(4);
      normalized = `55${ddd}9${phone}@s.whatsapp.net`;
      console.log('🇧🇷 Número brasileiro corrigido:', normalized);
    }
  }
  
  return this.formatRemoteJid(normalized);
}
```

### 5. ADICIONAR Try-Catch e Rollback

```typescript
async handleIncomingMessage(instanceId: string, messageData: any): Promise<void> {
  // ✅ Transaction para garantir consistência
  try {
    await prisma.$transaction(async (tx) => {
      // 1. Criar conversa
      const conversation = await this.createOrUpdateConversation(...);
      
      // 2. Salvar mensagem (se falhar, rollback automático)
      const message = await this.messageRepository.create(...);
      
      // 3. Atualizar conversa (se falhar, rollback automático)
      await this.conversationRepository.update(...);
    });
    
    // 4. Emitir WebSocket DEPOIS do commit
    this.socketService.emitToInstance(...);
    
  } catch (error) {
    console.error('❌ Transaction failed, rollback executed');
    throw error;
  }
}
```

---

## 📝 RESUMO EXECUTIVO

### Gravidade dos Problemas

| Problema | Gravidade | Impacto | Urgência |
|----------|-----------|---------|----------|
| MessageRepository incompleto | 🔴 Alta | Status não atualizável via repository | Alta |
| Repository Pattern quebrado | 🟡 Média | Código inconsistente, difícil de testar | Média |
| conversationId opcional | 🔴 Alta | Mensagens órfãs, dados perdidos | Alta |
| Normalização complexa | 🟡 Média | Risco de duplicatas | Média |
| Sem transaction/rollback | 🟠 Média-Alta | Dados inconsistentes em caso de erro | Média |

### Priorização

**🔴 Urgente (fazer AGORA):**
1. Corrigir MessageRepository (2-3 horas)
2. Tornar conversationId obrigatório (1 hora)

**🟡 Importante (próxima semana):**
3. Usar repository em handleMessageStatusUpdate (30 min)
4. Simplificar normalização de números (2 horas)
5. Adicionar transactions (1-2 horas)

---

**Análise realizada em:** 25 de outubro de 2025  
**Status:** ⚠️ Sistema funcional mas com débito técnico importante  
**Recomendação:** Implementar correções críticas antes de produção
