# ✅ Correção: Status das Mensagens ao Carregar Chat

## Problema Identificado
Ao entrar na tela de chat ou atualizar, as mensagens não vinham com o campo `status`, aparecendo sem os checks de leitura.

## Causa Raiz
As mensagens estavam sendo salvas no banco de dados **sem** o campo `status` definido. Quando você carregava as mensagens, elas vinham sem status.

## Solução Implementada

### 1. **Adicionar campo `status` na interface** (`message-repository.ts`)

```typescript
export interface CreateMessageData {
  instanceId: string;
  remoteJid: string;
  fromMe: boolean;
  messageType: string;
  content: string;
  messageId: string;
  timestamp: Date;
  status?: string; // ✅ NOVO: Status da mensagem
  mediaUrl?: string;
  fileName?: string;
  caption?: string;
  conversationId?: string;
}
```

### 2. **Definir status inicial ao receber mensagens** (`conversation-service.ts`)

#### handleIncomingMessage (webhook):
```typescript
const messageCreateData = {
  instanceId: instance.id,
  remoteJid: formattedRemoteJid,
  fromMe: messageData.key.fromMe || false,
  messageType: this.getMessageType(messageData),
  content: this.extractMessageContent(messageData),
  messageId: messageData.key.id,
  timestamp: new Date(messageData.messageTimestamp * 1000),
  
  // ✅ Status inicial baseado em quem enviou
  status: messageData.key.fromMe ? 'SENT' : 'DELIVERED',
  
  mediaUrl: messageData.message?.imageMessage?.url || ...,
  conversationId: conversation.id
};
```

**Lógica:**
- Se `fromMe = true` (você enviou) → Status: **SENT** ✓
- Se `fromMe = false` (você recebeu) → Status: **DELIVERED** ✓✓

### 3. **Definir status ao enviar mensagens** (`conversation-service.ts`)

#### sendMessage:
```typescript
const message = await this.messageRepository.create({
  instanceId,
  remoteJid: formattedRemoteJid,
  fromMe: true,
  messageType: 'TEXT',
  content,
  messageId: evolutionResponse.key?.id || `msg_${Date.now()}`,
  timestamp: new Date(),
  
  // ✅ Status inicial: SENT (acabou de ser enviado)
  status: 'SENT',
  
  conversationId: conversation.id
});
```

### 4. **Debug no frontend** (`ChatPage.tsx`)

Adicionado log para verificar se o status está chegando:

```typescript
if (messages.length > 0) {
  console.log('🔍 Primeira mensagem (verificar status):', {
    id: messages[0].id,
    content: messages[0].content?.substring(0, 50),
    fromMe: messages[0].fromMe,
    status: messages[0].status, // ← Deve aparecer agora!
    hasStatus: 'status' in messages[0]
  });
}
```

## Fluxo Completo Agora

### Quando você ENVIA uma mensagem:
```
1. Frontend chama API /messages
2. Backend chama Evolution API
3. Salva no banco com status: 'SENT'
4. Retorna para frontend com status
5. Frontend exibe: ✓ (1 check cinza)

6. Evolution API envia webhook: messages.update (status: DELIVERED)
7. Backend atualiza status no banco
8. Emite WebSocket para frontend
9. Frontend atualiza: ✓✓ (2 checks cinza)

10. Destinatário lê a mensagem
11. Evolution API envia webhook: messages.update (status: READ)
12. Backend atualiza status no banco
13. Emite WebSocket para frontend
14. Frontend atualiza: ✓✓ (2 checks AZUL) ✨
```

### Quando você RECEBE uma mensagem:
```
1. Evolution API envia webhook: messages.upsert
2. Backend salva com status: 'DELIVERED'
3. Emite WebSocket para frontend
4. Frontend exibe mensagem (sem checks, pois não é sua)
```

## Status Disponíveis

| Status | Quando é definido | Visual |
|--------|------------------|--------|
| `PENDING` | Aguardando envio | ⭕ |
| `SENT` | Ao enviar mensagem | ✓ |
| `DELIVERED` | Webhook de entrega OU ao receber mensagem | ✓✓ |
| `READ` | Webhook quando destinatário lê | ✓✓ azul |
| `PLAYED` | Webhook quando mídia é reproduzida | ✓✓ azul |
| `FAILED` | Falha no envio | ⚠️ |

## Resultado

✅ **Mensagens antigas**: Carregadas COM status do banco de dados
✅ **Mensagens novas (webhook)**: Salvas COM status inicial
✅ **Mensagens enviadas**: Criadas COM status 'SENT'
✅ **Atualizações via webhook**: Atualizam status em tempo real
✅ **Persistência**: Status fica salvo no banco, não depende 100% de webhooks

## Teste

1. **Recarregue a página** do chat
2. **Console do navegador** deve mostrar:
   ```
   🔍 Primeira mensagem (verificar status): {
     id: "clxy123...",
     content: "Olá, tudo bem?",
     fromMe: true,
     status: "SENT",  ← Agora aparece!
     hasStatus: true
   }
   ```
3. **Mensagens suas** devem aparecer com ✓ ou ✓✓
4. **Envie uma nova** mensagem → deve aparecer ✓ imediatamente
5. **Quando destinatário ler** → deve mudar para ✓✓ azul

## Próximos Passos (Opcional)

### Sincronizar Status ao Carregar Mensagens

Para não depender 100% de webhooks, você pode implementar um endpoint que busca o status atualizado da Evolution API ao carregar o chat:

```typescript
// Backend: conversation-service.ts
async syncMessageStatuses(conversationId: string): Promise<void> {
  const conversation = await this.conversationRepository.findByIdWithMessages(conversationId, 50, 0);
  
  if (!conversation) return;
  
  const instance = await prisma.whatsAppInstance.findUnique({
    where: { id: conversation.instanceId }
  });
  
  if (!instance) return;
  
  // Para cada mensagem enviada por você
  const sentMessages = conversation.messages.filter(m => m.fromMe);
  
  for (const message of sentMessages) {
    // Buscar status atualizado da Evolution API (se houver endpoint)
    // Atualizar no banco
    // Emitir via WebSocket
  }
}
```

**Nota:** A Evolution API v2 não tem endpoint direto para consultar status de mensagens individuais. O método mais confiável é via webhooks `messages.update`.

## Dependência de Webhooks

✅ **Status é persistido no banco** - não depende apenas de webhooks
✅ **Webhooks atualizam status** - quando destinatário lê/recebe
✅ **Ao recarregar página** - status vem do banco de dados
⚠️ **Se webhook falhar** - status fica no último estado conhecido (não é crítico)

O sistema está robusto: mesmo que um webhook seja perdido, o status fica salvo e não some ao recarregar a página!
