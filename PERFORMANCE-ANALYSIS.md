# 🚀 Análise de Performance - WhatsAI

## Requisições Analisadas

| Endpoint | Tempo (P50) | Tempo (P95) | Status | Problema |
|----------|-------------|-------------|--------|----------|
| `GET /api/conversations` | 828ms | 1.86s | 🔴 CRÍTICO | N+1 queries |
| `GET /api/instances` | 214-717ms | 717ms | 🟡 MODERADO | Requests em série |
| `GET /api/auth/me` | 210-635ms | 635ms | 🟡 MODERADO | Query ineficiente |
| `GET /api/conversations/:id/messages` | 669ms | 2.08s | 🔴 CRÍTICO | Sem índices |
| `POST /api/conversations/:id/messages` | 4.34s | 4.70s | 🔴 CRÍTICO | Timeout Evolution API |
| `POST /webhooks/evolution/:instanceId` | 4-4.34s | 4.34s | 🟡 MODERADO | Webhook pesado |

## 🔴 Problemas Críticos

### 1. GET `/api/conversations` - 828ms

**Problema:** Query N+1 - Para cada conversa, busca última mensagem separadamente.

**Código Atual:**
```typescript
// conversation-repository.ts
async findByInstanceId(instanceId: string): Promise<Conversation[]> {
  return this.prisma.conversation.findMany({
    where: { instanceId, isArchived: false },
    orderBy: [
      { isPinned: 'desc' },
      { lastMessageAt: 'desc' }
    ],
    include: {
      messages: {
        take: 1,
        orderBy: { timestamp: 'desc' }
      }
    }
  });
}
```

**Problema:** O `include.messages` faz 1 query adicional por conversa (N+1).

**Solução:**
```typescript
async findByInstanceId(instanceId: string): Promise<Conversation[]> {
  // Query otimizada com subquery
  const conversations = await this.prisma.$queryRaw`
    SELECT 
      c.*,
      m.id as "lastMessageId",
      m.content as "lastMessageContent",
      m."fromMe" as "lastMessageFromMe",
      m."messageType" as "lastMessageType",
      m.timestamp as "lastMessageTimestamp"
    FROM conversations c
    LEFT JOIN LATERAL (
      SELECT id, content, "fromMe", "messageType", timestamp
      FROM messages
      WHERE "conversationId" = c.id
      ORDER BY timestamp DESC
      LIMIT 1
    ) m ON true
    WHERE c."instanceId" = ${instanceId} 
      AND c."isArchived" = false
    ORDER BY c."isPinned" DESC, c."lastMessageAt" DESC
  `;
  
  return conversations;
}
```

**Ganho esperado:** 828ms → ~100ms (8x mais rápido!)

---

### 2. GET `/api/conversations/:id/messages` - 669ms

**Problema:** Falta índice composto na tabela `messages`.

**Solução - Adicionar no schema.prisma:**
```prisma
model Message {
  // ... campos existentes
  
  @@index([conversationId, timestamp(sort: Desc)])
  @@index([instanceId, timestamp(sort: Desc)])
  @@map("messages")
}
```

**Depois rodar:**
```bash
cd server
npx prisma db push
```

**Ganho esperado:** 669ms → ~50ms (13x mais rápido!)

---

### 3. POST `/api/conversations/:id/messages` - 4.34s

**Problema:** Timeout ou lentidão na Evolution API + verificação de WhatsApp.

**Código Atual:**
```typescript
async sendTextMessage(instanceName: string, number: string, text: string) {
  // 1. Verifica se número tem WhatsApp (LENTO - 2s)
  const whatsappCheck = await this.checkIsWhatsApp(instanceName, [number]);
  
  // 2. Envia mensagem (LENTO - 2s)
  const response = await this.client.post(`/message/sendText/${instanceName}`, payload);
  
  return response.data;
}
```

**Solução - Adicionar timeout e cache:**
```typescript
private whatsappNumberCache = new Map<string, { exists: boolean; expiresAt: number }>();

async sendTextMessage(instanceName: string, number: string, text: string) {
  const formattedNumber = number.includes('@') ? number : `${number}@s.whatsapp.net`;
  
  // Cache de 1 hora
  const cached = this.whatsappNumberCache.get(formattedNumber);
  if (cached && cached.expiresAt > Date.now()) {
    if (!cached.exists) {
      throw new Error(`O número ${number} não possui WhatsApp`);
    }
  } else {
    // Verificar com timeout de 3s
    try {
      const whatsappCheck = await Promise.race([
        this.checkIsWhatsApp(instanceName, [formattedNumber]),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 3000)
        )
      ]);
      
      const numberInfo = whatsappCheck.find((info: any) => 
        info.jid === formattedNumber || info.number === formattedNumber
      );
      
      const exists = numberInfo?.exists || false;
      this.whatsappNumberCache.set(formattedNumber, {
        exists,
        expiresAt: Date.now() + 3600000 // 1 hora
      });
      
      if (!exists) {
        throw new Error(`O número ${number} não possui WhatsApp`);
      }
    } catch (error) {
      // Em caso de timeout, tenta enviar mesmo assim
      console.warn('⚠️ Timeout ao verificar número, tentando enviar...');
    }
  }
  
  // Envia com timeout
  const response = await Promise.race([
    this.client.post(`/message/sendText/${instanceName}`, {
      number: formattedNumber,
      text: text,
      delay: 1200,
      linkPreview: false
    }),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout ao enviar')), 5000)
    )
  ]);
  
  return response.data;
}
```

**Ganho esperado:** 4.34s → ~800ms (5x mais rápido!)

---

### 4. GET `/api/auth/me` - 635ms

**Problema:** Query com includes desnecessários.

**Solução:**
```typescript
// auth-controller.ts
async getMe(req: Request, res: Response) {
  const userId = req.user?.userId;
  
  // Buscar apenas campos necessários
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      createdAt: true,
      // NÃO incluir instances aqui (pesado)
    }
  });
  
  res.json({ success: true, data: user });
}
```

**Ganho esperado:** 635ms → ~20ms (30x mais rápido!)

---

### 5. GET `/api/instances` - 717ms

**Problema:** Buscando status de cada instância na Evolution API em série.

**Código Atual:**
```typescript
for (const instance of instances) {
  const status = await evolutionApi.getInstanceStatus(instance.name); // SÉRIE
}
```

**Solução - Paralelizar:**
```typescript
// Buscar todos os status em paralelo
const statusPromises = instances.map(instance => 
  evolutionApi.getInstanceStatus(instance.evolutionInstanceName)
    .catch(() => 'DISCONNECTED') // Fallback se falhar
);

const statuses = await Promise.all(statusPromises);

// Atualizar instâncias
instances.forEach((instance, index) => {
  instance.status = statuses[index];
});
```

**Ganho esperado:** 717ms → ~150ms (4x mais rápido!)

---

## 🟢 Melhorias Adicionais

### 6. Adicionar Cache Redis (Opcional)

Para endpoints muito acessados:
```typescript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

// Cache de conversas por 30 segundos
async getConversations(instanceId: string) {
  const cacheKey = `conversations:${instanceId}`;
  const cached = await redis.get(cacheKey);
  
  if (cached) {
    return JSON.parse(cached);
  }
  
  const conversations = await this.conversationRepository.findByInstanceId(instanceId);
  
  await redis.setex(cacheKey, 30, JSON.stringify(conversations));
  
  return conversations;
}
```

---

## 📊 Resumo de Otimizações

| Otimização | Ganho | Dificuldade | Prioridade |
|------------|-------|-------------|------------|
| Índices no banco | 13x | Fácil | 🔴 Alta |
| Query otimizada conversas | 8x | Média | 🔴 Alta |
| Timeout Evolution API | 5x | Fácil | 🔴 Alta |
| Simplificar /auth/me | 30x | Fácil | 🟡 Média |
| Paralelizar instances | 4x | Fácil | 🟡 Média |
| Cache Redis | 100x | Média | 🟢 Baixa |

---

## 🎯 Plano de Ação Imediato

### Prioridade 1 (Fazer Agora):
1. ✅ Adicionar índices no banco de dados
2. ✅ Adicionar timeout na Evolution API
3. ✅ Otimizar query de conversas

### Prioridade 2 (Próximos dias):
4. ⏳ Paralelizar busca de status das instâncias
5. ⏳ Simplificar endpoint /auth/me
6. ⏳ Adicionar cache de números verificados

### Prioridade 3 (Futuro):
7. 🔮 Implementar Redis
8. 🔮 Adicionar paginação infinita
9. 🔮 Lazy loading de mensagens

---

## 🚀 Resultado Esperado Após Otimizações

| Endpoint | Antes | Depois | Ganho |
|----------|-------|--------|-------|
| GET /api/conversations | 828ms | ~100ms | 88% |
| GET /api/conversations/:id/messages | 669ms | ~50ms | 93% |
| POST /api/conversations/:id/messages | 4.34s | ~800ms | 82% |
| GET /api/auth/me | 635ms | ~20ms | 97% |
| GET /api/instances | 717ms | ~150ms | 79% |

**Média de melhoria:** ~88% mais rápido! 🎉
