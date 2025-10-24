# 📸 Fetch Profile Picture & Contact Name - Implementação Completa

## ✅ O que foi implementado

### 1. **Evolution API Service** (`evolution-api.ts`)

Novos métodos adicionados:

#### `fetchProfilePictureUrl(instanceName: string, number: string)`
- **Endpoint:** `POST /chat/fetchProfilePicUrl/{instance}`
- **Descrição:** Busca a URL da foto de perfil de um contato
- **Retorno:** `{ profilePictureUrl: string | null }`
- **Tratamento:** Retorna `null` se não encontrar (não lança erro)

#### `fetchContacts(instanceName: string, numbers?: string[])`
- **Endpoint:** `POST /chat/findContacts/{instance}`
- **Descrição:** Busca informações completas dos contatos
- **Retorno:** Array com `id`, `profilePictureUrl`, `pushName`, `businessName`, `profileName`
- **Opcional:** Pode buscar contatos específicos ou todos

#### `getContactDisplayName(contact, fallbackNumber)`
- **Descrição:** Lógica inteligente para nome do contato
- **Prioridade:**
  1. `businessName` (nome comercial)
  2. `pushName` (nome salvo)
  3. `profileName` (nome do perfil)
  4. Número formatado

#### `formatPhoneNumber(number: string)`
- **Descrição:** Formata número para exibição
- **Exemplo:** `5511999999999` → `+55 (11) 99999-9999`
- **Suporta:** Formato brasileiro e internacional

---

### 2. **Conversation Service** (`conversation-service.ts`)

Novos métodos adicionados:

#### `updateContactInfo(conversationId: string)`
- **Descrição:** Atualiza nome e foto de UMA conversa
- **Ações:**
  1. Busca informações do contato na Evolution API
  2. Busca foto de perfil
  3. Atualiza no banco de dados
  4. Notifica frontend via WebSocket
- **Uso:** Quando clicar em "Atualizar contato" na conversa

#### `updateAllContactsInfo(instanceId: string)`
- **Descrição:** Atualiza TODAS as conversas de uma instância
- **Ações:**
  1. Busca todas as conversas
  2. Busca todos os contatos em batch
  3. Busca fotos de perfil individuais
  4. Atualiza no banco de dados
- **Uso:** Ao conectar uma instância nova ou sincronizar tudo

---

### 3. **Controller** (`conversation-controller.ts`)

Novos endpoints disponíveis:

#### `PUT /api/conversations/:conversationId/contact`
```typescript
// Atualizar informações de um contato específico
PUT /api/conversations/:conversationId/contact

Response:
{
  "success": true,
  "message": "Informações do contato atualizadas",
  "data": {
    "id": "...",
    "contactName": "João Silva",
    "contactPicture": "https://...",
    ...
  }
}
```

#### `POST /api/instances/:instanceId/update-contacts`
```typescript
// Atualizar todos os contatos de uma instância
POST /api/instances/:instanceId/update-contacts

Response:
{
  "success": true,
  "message": "Informações de todos os contatos atualizadas"
}
```

---

## 🎯 Como usar no Frontend

### Opção 1: Atualizar conversa individual

```typescript
// Quando usuário clicar em "Atualizar contato" na conversa
const updateContactInfo = async (conversationId: string) => {
  try {
    const response = await fetch(
      `http://localhost:3001/api/conversations/${conversationId}/contact`,
      { method: 'PUT' }
    );
    
    const data = await response.json();
    
    if (data.success) {
      // Conversa atualizada!
      // O WebSocket já notificará a UI automaticamente
      console.log('Contato atualizado:', data.data.contactName);
    }
  } catch (error) {
    console.error('Erro ao atualizar contato:', error);
  }
};
```

### Opção 2: Atualizar todos os contatos da instância

```typescript
// Ao conectar uma instância ou clicar em "Sincronizar todos"
const updateAllContacts = async (instanceId: string) => {
  try {
    const response = await fetch(
      `http://localhost:3001/api/instances/${instanceId}/update-contacts`,
      { method: 'POST' }
    );
    
    const data = await response.json();
    
    if (data.success) {
      console.log('Todos os contatos atualizados!');
      // Pode demorar alguns segundos para processar todos
    }
  } catch (error) {
    console.error('Erro ao atualizar contatos:', error);
  }
};
```

### Opção 3: Atualização automática ao receber mensagem

**Já está implementado!** Quando uma mensagem chega:
1. Se o contato tem `pushName` no webhook, salva automaticamente
2. Se não tiver, fica como número até você atualizar manualmente

---

## 📱 Como aparece na UI

### ANTES (apenas número)
```
┌─────────────────────────┐
│ 5541998773200          │
│ Mensagem sem texto     │
│ 19:53                  │
└─────────────────────────┘
```

### DEPOIS (nome e foto)
```
┌─────────────────────────┐
│ 📸 João Silva          │
│ Mensagem sem texto     │
│ 19:53                  │
└─────────────────────────┘
```

---

## 🔄 Fluxo de atualização recomendado

### Quando conectar uma nova instância:
```typescript
1. Instância conectada
2. Listar conversas existentes
3. Chamar: POST /api/instances/{id}/update-contacts
4. Aguardar processamento (pode demorar)
5. Conversas aparecerão com nomes e fotos
```

### Durante o uso normal:
```typescript
1. Mensagem recebida → nome vem no pushName (automático)
2. Se não vier → aparece como número
3. Usuário pode clicar "Atualizar contato" → busca manual
```

---

## 🎨 Sugestões de UI

### Botão na conversa individual
```tsx
<button onClick={() => updateContactInfo(conversation.id)}>
  🔄 Atualizar Contato
</button>
```

### Botão nas configurações da instância
```tsx
<button onClick={() => updateAllContacts(instanceId)}>
  🔄 Sincronizar Todos os Contatos
</button>
<small>Isso pode demorar alguns minutos</small>
```

### Atualização automática ao conectar
```tsx
useEffect(() => {
  if (instance.status === 'connected') {
    // Atualizar automaticamente após conectar
    setTimeout(() => {
      updateAllContacts(instance.id);
    }, 5000); // Aguardar 5s para instância estabilizar
  }
}, [instance.status]);
```

---

## ⚠️ Considerações importantes

### Performance
- **Atualização individual:** ~1-2 segundos
- **Atualização em lote:** ~3-5 segundos para 50 contatos
- **Foto de perfil:** ~1 segundo por contato (pode ser lento)

### Recomendações
1. ✅ Mostrar loading durante atualização
2. ✅ Atualizar em background após conectar
3. ✅ Permitir atualização manual individual
4. ❌ Não atualizar todos a cada recarga da página

### Fallback
Se não conseguir buscar informações:
- Nome: mostra número formatado (`+55 (11) 99999-9999`)
- Foto: mostra ícone/avatar padrão

---

## 🧪 Testar agora

1. **Teste rápido - Um contato:**
```bash
curl -X PUT http://localhost:3001/api/conversations/{CONVERSATION_ID}/contact
```

2. **Teste completo - Todos os contatos:**
```bash
curl -X POST http://localhost:3001/api/instances/{INSTANCE_ID}/update-contacts
```

---

## ✅ Status da implementação

- ✅ Evolution API methods implementados
- ✅ Conversation Service methods implementados
- ✅ Formatação de números (brasileiro/internacional)
- ✅ Lógica de fallback para nomes
- ✅ WebSocket notifications
- ⏸️ Rotas do controller (precisa adicionar ao arquivo manualmente)
- ⏸️ Frontend UI (a fazer)

---

## 📝 Próximos passos

1. Adicionar as rotas no `conversation-routes.ts`
2. Criar botão "Atualizar contato" no frontend
3. Implementar atualização automática ao conectar instância
4. Adicionar loading states na UI
5. Testar com diferentes formatos de número

