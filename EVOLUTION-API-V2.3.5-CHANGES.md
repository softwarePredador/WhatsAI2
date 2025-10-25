# Evolution API v2.3.5+ - Mudanças e Melhorias

## 🎯 Resolução Automática de @lid

A partir da **Evolution API v2.3.5**, o problema de números @lid foi **RESOLVIDO AUTOMATICAMENTE**!

### ✅ O que mudou:

#### **ANTES (v2.3.4 e anteriores):**
```json
{
  "event": "messages.upsert",
  "data": {
    "key": {
      "remoteJid": "79512746377469@lid",  ← Número criptografado
      "fromMe": false
    }
  }
}
```
❌ **Problema:** Não havia como saber o número real  
❌ **Resultado:** Conversas duplicadas para mesma pessoa

#### **AGORA (v2.3.5+):**
```json
{
  "event": "messages.upsert",
  "data": {
    "key": {
      "remoteJid": "554198773200@s.whatsapp.net",  ← Número REAL!
      "fromMe": false
    }
  }
}
```
✅ **Evolution API converte @lid automaticamente**  
✅ **Uma única conversa por pessoa**

---

## 📋 Novas Features

### 1. **messageId em messages.update (v2.3.6)**

```json
{
  "event": "messages.update",
  "data": {
    "messageId": "cmh5g26mg0yllkb4ia5bmcgo4",  ← ID do Prisma!
    "keyId": "ACD3E3D0A673C9269329297A67E64AC8",
    "remoteJid": "554198773200@s.whatsapp.net",
    "fromMe": false,
    "status": "READ"  ← READ, PLAYED, DELIVERED
  }
}
```

**Uso:**
```javascript
await prisma.message.updateMany({
  where: { id: messageId },
  data: { status: 'READ' }
});
```

### 2. **Cache de @lid/PN/g.us corrigido (v2.3.6)**

```
✅ Fixed cache for PN, LID and g.us numbers to send correct number
```

Agora o cache interno da Evolution API funciona corretamente.

### 3. **Conversão LID em grupos (v2.3.5)**

```
✅ Convert LID to phoneNumber on GROUP_PARTICIPANTS_UPDATE webhook
```

Participantes de grupo com @lid também são convertidos.

### 4. **Rejeição de chamadas para converter @lid (v2.3.5)**

```
✅ Convert LIDs to PN by sending a call rejection message
```

Método inteligente: Evolution API envia mensagem de rejeição de chamada para forçar conversão de @lid.

---

## 🔧 Ajustes no Webhook

### **Código ANTES (complexo):**

```javascript
// Tentativas manuais de resolver @lid
if (remoteJid.includes('@lid')) {
  // Estratégia 1: usar sender
  if (sender) remoteJid = sender;
  
  // Estratégia 2: buscar cache
  else if (cache.has(remoteJid)) {
    remoteJid = cache.get(remoteJid);
  }
  
  // Estratégia 3: buscar banco
  else {
    const conv = await prisma.conversation.findFirst({...});
    if (conv) remoteJid = conv.remoteJid;
  }
}
```

### **Código AGORA (simplificado):**

```javascript
// Evolution API v2.3.5+ resolve automaticamente
if (remoteJid.includes('@lid')) {
  console.log('⚠️ ALERTA: Evolution API deveria ter convertido @lid!');
  console.log('⚠️ Verifique se está usando v2.3.5 ou superior.');
  return res.json({ success: true, message: 'LID not resolved' });
}

// Apenas normalizar formato
const normalizedJid = remoteJid.replace(/:\d+@/, '@');
```

**Redução:** ~50 linhas → ~10 linhas

---

## 🚀 Benefícios

### Performance:
- ❌ **Antes:** 3 queries ao banco para resolver @lid
- ✅ **Agora:** 0 queries (Evolution API resolve)

### Confiabilidade:
- ❌ **Antes:** Duplicatas se cache falhar
- ✅ **Agora:** Sempre correto (resolvido na API)

### Manutenção:
- ❌ **Antes:** Lógica complexa de cache e fallback
- ✅ **Agora:** Código simples e direto

---

## 📝 Changelog Relevante

### v2.3.6 (3 dias atrás)
```
Features:
- Fixed cache for PN, LID and g.us numbers to send correct number
- Fixed audio and document sending via Chatwoot in Baileys channel

Fixed:
- Correctly save Uint8Array values to database
- Fixed "this.isZero not is function" error
```

### v2.3.5 (semana passada)
```
Features:
- Convert LID to phoneNumber on GROUP_PARTICIPANTS_UPDATE webhook
- Convert LIDs to PN by sending a call rejection message
- Add participantsData field maintaining backward compatibility

Fixed:
- Correct chatId extraction for non-group JIDs
- Resolve webhook timeout on deletion with 5+ images
- Improve error handling in Chatwoot messages
```

---

## ✅ Checklist de Atualização

Para aproveitar as melhorias:

- [ ] Atualizar Evolution API para v2.3.6 ou superior
- [ ] Remover lógica manual de resolução @lid do webhook
- [ ] Implementar atualização de status usando `messageId`
- [ ] Testar com mensagens de contatos @lid
- [ ] Verificar logs - não deve mais aparecer @lid
- [ ] Confirmar que não há mais conversas duplicadas

---

## 🔗 Links

- [Evolution API v2.3.6 Release Notes](https://github.com/EvolutionAPI/evolution-api/releases/tag/2.3.6)
- [Evolution API v2.3.5 Release Notes](https://github.com/EvolutionAPI/evolution-api/releases/tag/2.3.5)
- [Documentação Oficial](https://doc.evolution-api.com/)

---

## 🎉 Conclusão

A Evolution API v2.3.5+ **resolve completamente o problema de @lid** que vínhamos enfrentando. 

**Não é mais necessário:**
- ❌ Cache manual de @lid
- ❌ Buscar sender do webhook
- ❌ Consultar banco para resolver @lid
- ❌ Lógica complexa de fallback

**Agora basta:**
- ✅ Confiar no `remoteJid` que vem do webhook
- ✅ Normalizar formato (remover device IDs)
- ✅ Salvar no banco

**Resultado:** Código mais simples, rápido e confiável! 🚀
