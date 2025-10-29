# 📸 Lógica de Atualização de Foto de Perfil em Tempo Real

## ✅ SIM! A foto atualiza automaticamente sem precisar F5

## 🔄 Fluxo Completo (Backend → Frontend)

### 1️⃣ **Webhook recebe evento `contacts.update`**
```typescript
// 📍 Arquivo: webhook-controller.ts (linha ~390-450)

if (validatedWebhookData.event === 'contacts.update') {
  const contacts = Array.isArray(validated.data.data) 
    ? validated.data.data 
    : [validated.data.data];
    
  for (const contactData of contacts) {
    const remoteJid = contactData.remoteJid;
    const profilePicUrl = contactData.profilePicUrl;  // 🖼️ URL da foto
    const pushName = contactData.pushName;            // 👤 Nome do contato
    
    // Chama serviço para atualizar
    await conversationService.updateContactFromWebhook(instanceId, remoteJid, {
      ...(pushName && { contactName: pushName }),
      ...(profilePicUrl && { contactPicture: profilePicUrl })
    });
  }
}
```

**Dados do webhook:**
```json
{
  "event": "contacts.update",
  "data": {
    "remoteJid": "120363129197033819@g.us",
    "pushName": "Lorrany",
    "profilePicUrl": "https://pps.whatsapp.net/v/t61.24694-24/442384863_2468219456711424_5352943523297884722_n.jpg?ccb=11-4&oh=01_Q5Aa2wH2dzZCB2Iafz4as3w58PqZgbH33LSH3XCDDuEU-MeuMw&oe=690F3BB5&_nc_sid=5e03e0&_nc_cat=106"
  }
}
```

---

### 2️⃣ **Serviço atualiza banco de dados**
```typescript
// 📍 Arquivo: conversation-service.ts (linha 433-530)

async updateContactFromWebhook(instanceId: string, remoteJid: string, data: { 
  contactName?: string; 
  contactPicture?: string 
}) {
  // ✅ Normaliza o JID (funciona com grupos, @lid, números internacionais)
  const normalizedJid = this.normalizeWhatsAppNumber(remoteJid, null, isGroupContact);
  
  // ✅ Busca conversa com 3 estratégias de matching:
  // 1. Match direto pelo JID normalizado
  // 2. Resolução de @lid (3 sub-estratégias)
  // 3. Variações do número (com/sem código país)
  
  const conversation = await findConversation();
  
  if (conversation) {
    // ✅ Atualiza no banco
    const updateData: any = {};
    if (data.contactName) updateData.contactName = data.contactName;
    if (data.contactPicture) updateData.contactPicture = data.contactPicture;
    
    await this.conversationRepository.update(conversation.id, updateData);
    
    // ✅ Busca dados atualizados
    const updated = await this.conversationRepository.findById(conversation.id);
    
    // ✅ EMITE WEBSOCKET PARA O FRONTEND (SEM PRECISAR F5!)
    this.socketService.emitToInstance(instanceId, 'conversation:updated', updated);
  }
}
```

**Logs do backend:**
```bash
👤 [CONTACT_UPDATE] Processing contact: remoteJid=120363129197033819@g.us, pushName=Lorrany, hasPic=true
👤 [CONTACT_UPDATE] Lorrany: foto=true, nome=true
📝 [CONTACT_UPDATE] Updating conversation cmhc87por000c8jwfqmbhg9qr with: {
  contactName: 'Lorrany',
  contactPicture: 'https://pps.whatsapp.net/v/...'
}
📡 [CONTACT_UPDATE] Emitindo conversation:updated via WebSocket: {
  id: 'cmhc87por000c8jwfqmbhg9qr',
  remoteJid: '120363129197033819@g.us',
  contactName: 'Lorrany',
  contactPicture: '✅ TEM FOTO'
}
✅ [CONTACT_UPDATE] Successfully updated contact: Lorrany
```

---

### 3️⃣ **WebSocket emite evento para sala da instância**
```typescript
// 📍 Arquivo: socket-service.ts

emitToInstance(instanceId: string, event: string, data: any) {
  const room = `instance_${instanceId}`;
  console.log(`📡 [WebSocket] EMITINDO "${event}" para sala "${room}"`);
  this.io.to(room).emit(event, data);
}
```

**Logs do WebSocket:**
```bash
📡 [WebSocket] EMITINDO "conversation:updated" para sala "instance_cmh73gobi0001vr6waqem8syp" (1 clientes)
📡 [WebSocket] Dados: {
  id: 'cmhc87por000c8jwfqmbhg9qr',
  remoteJid: '120363129197033819@g.us',
  contactName: 'Lorrany',
  contactPicture: 'https://pps.whatsapp.net/v/...',
  isGroup: true,
  unreadCount: 1,
  lastMessage: '...',
  lastMessageAt: '2025-10-29T16:44:57.000Z'
}
```

---

### 4️⃣ **Frontend recebe via WebSocket e atualiza UI**
```typescript
// 📍 Arquivo: ConversationList.tsx (linha 58-105)

const handleConversationUpdated = (updatedConversation: any) => {
  console.log('🔔 [ConversationList] RECEBEU EVENTO conversation:updated:', updatedConversation);
  
  // ✅ Normaliza dados (converte datas)
  const normalizedConversation: ConversationSummary = {
    ...updatedConversation,
    lastMessageAt: updatedConversation.lastMessageAt 
      ? new Date(updatedConversation.lastMessageAt) 
      : undefined,
  };
  
  // ✅ Atualiza estado React (dispara re-render)
  setConversations(prevConversations => {
    const index = prevConversations.findIndex(c => c.id === normalizedConversation.id);
    
    if (index !== -1) {
      // Atualizar conversa existente
      const updated = [...prevConversations];
      updated[index] = {
        ...updated[index],
        ...normalizedConversation  // ✅ Inclui contactPicture atualizado
      };
      
      // Reordenar por data
      return updated.sort((a, b) => {
        const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
        const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
        return timeB - timeA;
      });
    } else {
      // Nova conversa
      return [normalizedConversation, ...prevConversations];
    }
  });
};

// ✅ Registra listener
socketService.on('conversation:updated', handleConversationUpdated);
```

**Logs do frontend:**
```bash
🔔 [ConversationList] RECEBEU EVENTO conversation:updated: {
  id: 'cmhc87por000c8jwfqmbhg9qr',
  contactName: 'Lorrany',
  contactPicture: 'https://pps.whatsapp.net/v/...',
  lastMessage: '...'
}
🔔 [ConversationList] Procurando conversa com ID: cmhc87por000c8jwfqmbhg9qr
🔔 [ConversationList] Índice encontrado: 0
🔔 [ConversationList] Atualizando conversa existente (index 0)
```

---

### 5️⃣ **React re-renderiza com nova foto**
```tsx
// 📍 Arquivo: ConversationList.tsx (linha 350-370)

{conversation.contactPicture ? (
  <img
    src={conversation.contactPicture}  // ✅ URL da foto atualizada
    alt={conversation.contactName || 'Contato'}
    className="h-12 w-12 rounded-full object-cover"
  />
) : (
  <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
    <span className="text-primary-content font-medium text-lg">
      {(conversation.contactName || '?').charAt(0).toUpperCase()}
    </span>
  </div>
)}
```

---

## 🎯 Resumo do Fluxo

```
1. Evolution API → Webhook contacts.update
                   ↓
2. webhook-controller.ts → conversationService.updateContactFromWebhook()
                   ↓
3. Atualiza banco (Prisma)
   UPDATE conversations SET contactPicture = '...' WHERE id = '...'
                   ↓
4. socketService.emitToInstance('conversation:updated', updatedData)
                   ↓
5. WebSocket → Envia para sala "instance_XXX"
                   ↓
6. Frontend (ConversationList.tsx) → handleConversationUpdated()
                   ↓
7. setConversations() → React re-render
                   ↓
8. ✅ FOTO APARECE AUTOMATICAMENTE SEM F5!
```

---

## ✅ Checklist de Verificação

- [x] **Webhook recebe `contacts.update`** ✅
- [x] **Backend atualiza `contactPicture` no banco** ✅
- [x] **Backend emite evento `conversation:updated` via WebSocket** ✅
- [x] **Frontend está ouvindo `conversation:updated`** ✅
- [x] **Frontend atualiza estado React** ✅
- [x] **Componente `<img>` renderiza com nova URL** ✅
- [x] **Funciona sem precisar F5** ✅

---

## 🔍 Como Testar

1. **Envie uma mensagem** de um contato para sua instância
2. **Mude a foto de perfil** desse contato no WhatsApp
3. **Observe os logs** do backend:
   ```bash
   👤 [CONTACTS_UPDATE] Processing contact: remoteJid=..., hasPic=true
   📡 [CONTACT_UPDATE] Emitindo conversation:updated via WebSocket
   ```
4. **Observe os logs** do frontend (F12 → Console):
   ```bash
   🔔 [ConversationList] RECEBEU EVENTO conversation:updated
   🔔 [ConversationList] Atualizando conversa existente
   ```
5. **Veja a foto atualizar** automaticamente na lista de conversas! 🎉

---

## 🚀 Tecnologias Envolvidas

- **Socket.io** - WebSocket em tempo real
- **React Hooks** - `useState` para atualização reativa
- **Prisma ORM** - Persistência no PostgreSQL
- **Evolution API** - Webhooks do WhatsApp
- **TypeScript** - Type safety em todo o fluxo

---

## 💡 Observação Importante

A foto só atualiza **se a conversa já existir** na lista. Se for um contato totalmente novo (primeira mensagem), o evento `messages.upsert` cria a conversa E já traz a foto junto (se disponível).

Caso a foto não apareça:
1. ✅ Verifique se o webhook `contacts.update` está chegando
2. ✅ Verifique se `profilePicUrl` não está `null` no payload
3. ✅ Verifique se o frontend está conectado ao WebSocket
4. ✅ Verifique se está na sala correta (`instance_XXX`)
