# Como Adicionar Campo Status nas Mensagens

## ⚠️ Problema Atual

O webhook v2.3.6 recebe eventos `messages.update` com status (DELIVERED, READ, PLAYED), mas o **schema do Prisma não tem campo `status`** no model `Message`.

**Erro atual:**
```
Unknown argument `status`. Available options are marked with ?.
```

---

## ✅ Solução: Adicionar Campo Status

### 1. **Atualizar Schema do Prisma**

Edite `server/prisma/schema.prisma`:

```prisma
model Message {
  id          String  @id @default(cuid())
  instanceId  String
  remoteJid   String
  fromMe      Boolean
  messageType String
  content     String
  mediaUrl    String?
  fileName    String?
  caption     String?
  messageId   String   @unique
  timestamp   DateTime
  
  // 🆕 ADICIONAR ESTE CAMPO:
  status      String?  @default("PENDING") // PENDING, SENT, DELIVERED, READ, PLAYED, FAILED
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  instance       WhatsAppInstance @relation(fields: [instanceId], references: [id], onDelete: Cascade)
  conversation   Conversation?    @relation(fields: [conversationId], references: [id])
  conversationId String?

  @@map("messages")
}
```

### 2. **Criar e Aplicar Migration**

```bash
cd server
npx prisma migrate dev --name add_message_status
```

Ou, se preferir apenas push sem migration:

```bash
npx prisma db push
```

### 3. **Atualizar Webhook**

Depois de adicionar o campo no banco, **descomente** o código no webhook:

**webhook-deploy/index.js** (linhas ~44-66):

```javascript
// Se tiver messageId (novo na v2.3.6), atualizar status no banco
if (messageId && status) {
  try {
    const updated = await prisma.message.updateMany({
      where: { 
        id: messageId,
        conversation: {
          instance: {
            evolutionInstanceName: instanceId
          }
        }
      },
      data: {
        status: status // READ, DELIVERED, PLAYED, SENT, FAILED
      }
    });
    
    if (updated.count > 0) {
      console.log(`✅ [${instanceId}] Status atualizado: ${messageId} → ${status}`);
    }
  } catch (error) {
    console.error(`❌ [${instanceId}] Erro ao atualizar status:`, error.message);
  }
}
```

### 4. **Atualizar Frontend (Opcional)**

Se quiser exibir status no chat, atualizar componente de mensagem:

```tsx
// client/src/components/MessageBubble.tsx
<div className="message-status">
  {message.status === 'READ' && '✓✓ Lido'}
  {message.status === 'DELIVERED' && '✓✓ Entregue'}
  {message.status === 'SENT' && '✓ Enviado'}
  {message.status === 'PENDING' && '⏳ Enviando...'}
  {message.status === 'FAILED' && '❌ Falhou'}
</div>
```

---

## 📊 Valores de Status

Evolution API envia estes status:

| Status Evolution | Usar como | Significado |
|-----------------|-----------|-------------|
| `PENDING` | `PENDING` | Aguardando envio |
| `SERVER_ACK` | `SENT` | Enviado ao servidor WhatsApp |
| `DELIVERY_ACK` | `DELIVERED` | Entregue ao destinatário |
| `READ` | `READ` | Lida pelo destinatário |
| `PLAYED` | `PLAYED` | Áudio/vídeo reproduzido |
| `ERROR` | `FAILED` | Falha no envio |

---

## 🔄 Migração de Dados Existentes

Após adicionar o campo, mensagens antigas terão `status = null`. Para corrigir:

```sql
-- Setar status padrão para mensagens antigas
UPDATE messages 
SET status = CASE 
  WHEN "fromMe" = true THEN 'SENT'
  ELSE 'DELIVERED'
END
WHERE status IS NULL;
```

Ou via Prisma:

```typescript
// server/scripts/fix-message-status.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixStatus() {
  // Mensagens enviadas por mim
  await prisma.message.updateMany({
    where: { 
      status: null,
      fromMe: true
    },
    data: { status: 'SENT' }
  });
  
  // Mensagens recebidas
  await prisma.message.updateMany({
    where: { 
      status: null,
      fromMe: false
    },
    data: { status: 'DELIVERED' }
  });
  
  console.log('✅ Status das mensagens corrigido');
}

fixStatus();
```

---

## ⚡ Performance

Se tiver muitas mensagens, adicione índice:

```prisma
model Message {
  // ... campos existentes
  
  @@index([status])
  @@index([status, fromMe])
}
```

---

## 🎯 Benefícios

Após implementar:

- ✅ Ver quando mensagens foram entregues
- ✅ Ver quando mensagens foram lidas
- ✅ Debugar problemas de entrega
- ✅ Métricas de engajamento (taxa de leitura)
- ✅ Notificações de status em tempo real

---

## 📝 Por Enquanto

**O webhook atual funciona sem o campo `status`:**

- ✅ Mensagens são salvas corretamente
- ✅ Conversas funcionam normalmente
- ✅ @lid resolvido automaticamente
- ⚠️ Status apenas logado (não salvo no banco)

**Quando estiver pronto para adicionar status:**
1. Seguir os passos acima
2. Recompilar webhook
3. Fazer novo deploy

---

**Status:** Funcionalidade opcional  
**Impacto:** Nenhum (sistema funciona sem)  
**Prioridade:** Baixa (nice to have)
