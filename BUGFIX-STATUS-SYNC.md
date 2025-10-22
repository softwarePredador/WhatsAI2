# 🐛 Bug Fix: Status "connecting" não atualiza para "connected"

**Data:** 21 de Outubro de 2025
**Instância Afetada:** `whatsai_dc7b043e_45af_4511_a06b_783f64f7cd89`

---

## 📋 Problema Identificado

### **Sintoma:**
Instância mostra como "connecting" no frontend, mas Evolution API retorna `"connectionStatus": "open"` e `"state": "open"` (conectado).

### **Causa Raiz:**
O sistema não estava **sincronizando o status** automaticamente com a Evolution API. O status ficava estagnado no valor inicial sem atualização.

### **Impacto:**
- ❌ Usuário não sabe se instância conectou
- ❌ Status desatualizado mesmo após conexão bem-sucedida
- ❌ Necessário refresh manual da página
- ❌ Cards mostram status incorreto

---

## 🔍 Investigação

### **1. Verificação Evolution API:**

```bash
npx tsx scripts/check-instance-status.ts
```

**Resultado:**
```json
{
  "connectionStatus": "open",     // ← CONECTADO!
  "state": "open",                // ← CONECTADO!
  "ownerJid": "554191188909@s.whatsapp.net",
  "profileName": null,
  "number": null
}
```

✅ **Evolution API confirma: instância está CONECTADA**

### **2. Status no Banco de Dados:**
```
status: "connecting"   ← INCORRETO
connected: false       ← INCORRETO
```

### **3. Conclusão:**
Sistema não estava consultando Evolution API para atualizar status após conexão inicial.

---

## ✅ Solução Implementada

### **1. Método de Sincronização no Backend**

**Arquivo:** `server/src/api/controllers/instance-controller.ts`

```typescript
// Sincronizar status de UMA instância
refreshInstanceStatus = async (req: Request, res: Response): Promise<void> => {
  const { instanceId } = req.params;
  
  console.log('🔄 [RefreshStatus] Syncing status for instance:', instanceId);
  
  await this.instanceService.refreshInstanceStatus(instanceId);
  const instance = await this.instanceService.getInstanceById(instanceId);
  
  console.log('✅ [RefreshStatus] Status synced:', instance?.status);
  
  res.json({
    success: true,
    data: instance,
    message: 'Instance status refreshed'
  });
};

// Sincronizar status de TODAS as instâncias
syncAllInstancesStatus = async (req: Request, res: Response): Promise<void> => {
  console.log('🔄 [SyncAll] Syncing all instances status...');
  
  const instances = await this.instanceService.getAllInstances();
  
  await Promise.all(
    instances.map(instance => 
      this.instanceService.refreshInstanceStatus(instance.id)
    )
  );
  
  const updatedInstances = await this.instanceService.getAllInstances();
  
  res.json({
    success: true,
    data: updatedInstances,
    message: 'All instances status synced'
  });
};
```

### **2. Auto-Sync no `getAllInstances()`**

**Arquivo:** `server/src/services/instance-service.ts`

```typescript
async getAllInstances(): Promise<WhatsAppInstance[]> {
  // Load from database if cache empty
  if (this.instances.size === 0) {
    const dbInstances = await this.repository.findAll();
    dbInstances.forEach(instance => {
      this.instances.set(instance.id, instance);
    });
  }
  
  // 🔄 NOVO: Auto-sync status com Evolution API
  console.log('🔄 [getAllInstances] Syncing status for all instances...');
  const instances = Array.from(this.instances.values());
  
  await Promise.all(
    instances.map(async (instance) => {
      try {
        const apiStatus = await this.evolutionApi.getInstanceStatus(
          instance.evolutionInstanceName
        );
        
        // Only update if status changed
        if (instance.status !== apiStatus) {
          console.log(
            `📊 Status changed: ${instance.name}: ${instance.status} → ${apiStatus}`
          );
          
          instance.status = apiStatus;
          instance.connected = apiStatus === InstanceStatus.CONNECTED;
          instance.updatedAt = new Date();
          
          if (apiStatus === InstanceStatus.CONNECTED) {
            instance.connectedAt = new Date();
          }
          
          this.instances.set(instance.id, instance);
          
          // Update database
          await this.repository.update(instance.id, {
            status: apiStatus,
            connected: apiStatus === InstanceStatus.CONNECTED
          });
          
          // Emit WebSocket event
          this.socketService.emitToInstance(instance.id, 'status_changed', {
            instanceId: instance.id,
            status: apiStatus
          });
        }
      } catch (error) {
        console.error(`❌ Error syncing ${instance.name}:`, error);
      }
    })
  );
  
  return Array.from(this.instances.values());
}
```

### **3. Novas Rotas HTTP**

**Arquivo:** `server/src/api/routes/instances.ts`

```typescript
// Sync individual instance
router.post('/:instanceId/refresh-status', instanceController.refreshInstanceStatus);

// Sync all instances
router.post('/sync-all', instanceController.syncAllInstancesStatus);
```

### **4. Serviços no Frontend**

**Arquivo:** `client/src/features/instances/services/instanceService.ts`

```typescript
/**
 * Sync all instances status with Evolution API
 */
async syncAllInstancesStatus(token: string): Promise<WhatsAppInstance[]> {
  const response = await axios.post<InstanceListResponse>(
    `${API_URL}/instances/sync-all`,
    {},
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  
  return response.data.data;
},

/**
 * Refresh a specific instance status from Evolution API
 */
async refreshInstanceStatus(instanceId: string, token: string): Promise<WhatsAppInstance> {
  const response = await axios.post<InstanceResponse>(
    `${API_URL}/instances/${instanceId}/refresh-status`,
    {},
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  
  return response.data.data;
}
```

---

## 🎯 Comportamento Agora

### **Fluxo de Sincronização:**

```
1. Frontend faz auto-refresh a cada 5s
   ↓
2. Backend: getAllInstances() chama getInstanceStatus() para cada instância
   ↓
3. Evolution API consultada: GET /instance/connectionState/{name}
   ↓
4. Status comparado: "connecting" vs "open"
   ↓
5. Status atualizado: 
   - Memory cache
   - Database (Prisma)
   - WebSocket event
   ↓
6. Frontend recebe status atualizado
   ↓
7. Card atualiza para "Conectado" ✅
```

### **Logs Esperados:**

**Backend (auto-sync):**
```
🔄 [getAllInstances] Syncing status for all instances...
📊 [getAllInstances] Status changed for MyInstance: connecting → connected
💾 [getAllInstances] Status updated in database
📡 [getAllInstances] WebSocket event emitted
```

**Frontend (auto-refresh):**
```
🔄 [InstancesPage] Auto-syncing instances with Evolution API...
✅ [InstancesPage] Instances synced
```

---

## 🧪 Como Testar

### **Teste 1: Auto-Sync Funcionando**

1. **Acesse** `/instances`
2. **Observe console:**
   - A cada 5s: `🔄 [getAllInstances] Syncing status...`
   - Se houver mudança: `📊 Status changed: ... → ...`
3. **Conecte instância** via WhatsApp
4. **Aguarde ~5s**
5. ✅ Status deve mudar automaticamente para "Conectado"

### **Teste 2: Sync Manual**

**Via cURL (PowerShell):**
```powershell
Invoke-WebRequest `
  -Uri "http://localhost:3000/api/instances/sync-all" `
  -Method POST `
  -Headers @{"Authorization"="Bearer SEU_TOKEN"}
```

**Resposta esperada:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "name": "MyInstance",
      "status": "connected",  // ← Atualizado!
      "connected": true       // ← Atualizado!
    }
  ],
  "message": "All instances status synced"
}
```

### **Teste 3: Verificação Evolution API**

```bash
npx tsx scripts/check-instance-status.ts
```

Deve retornar `"connectionStatus": "open"` e sistema deve refletir isso.

---

## 📊 Antes vs Depois

| Aspecto | Antes | Depois |
|---------|-------|--------|
| **Sincronização** | ❌ Manual (apenas fetch DB) | ✅ Automática (consulta Evolution API) |
| **Frequência** | ❌ Apenas no load inicial | ✅ A cada 5s + on-demand |
| **Status desatualizado** | ❌ Sim (ficava "connecting") | ✅ Não (sempre sincronizado) |
| **Rotas de sync** | ❌ Não existiam | ✅ `/sync-all` e `/:id/refresh-status` |
| **WebSocket events** | ⚠️ Parcial | ✅ Emitidos automaticamente |
| **Performance** | ⚠️ N/A | ✅ Otimizado (só atualiza se mudou) |

---

## 🚀 Próximos Passos

### **1. Implementar WebSocket em Tempo Real (FASE 3)**
Ao invés de polling a cada 5s, usar WebSocket para receber atualizações instantâneas do backend quando Evolution API notificar mudanças via webhook.

### **2. Adicionar Indicador de "Última Sincronização"**
```tsx
<p className="text-xs text-base-content/60">
  Última sincronização: {formatDistanceToNow(lastSync)} atrás
</p>
```

### **3. Configurar Webhook da Evolution API**
Para que Evolution API notifique nosso backend quando status mudar, eliminando necessidade de polling.

---

## 📝 Arquivos Modificados

1. ✅ `server/src/api/controllers/instance-controller.ts`
   - Métodos: `refreshInstanceStatus`, `syncAllInstancesStatus`

2. ✅ `server/src/api/routes/instances.ts`
   - Rotas: `POST /sync-all`, `POST /:id/refresh-status`

3. ✅ `server/src/services/instance-service.ts`
   - Método `getAllInstances()` agora auto-sincroniza

4. ✅ `client/src/features/instances/services/instanceService.ts`
   - Métodos: `syncAllInstancesStatus`, `refreshInstanceStatus`

5. ✅ `client/src/features/instances/pages/InstancesPage.tsx`
   - Auto-refresh a cada 5s usa `fetchInstances` (que agora auto-sincroniza)

---

## ✅ Status da Correção

- [x] Investigação completa (Evolution API vs Database)
- [x] Método de sync no backend
- [x] Rotas HTTP criadas
- [x] Serviços no frontend
- [x] Auto-sync em `getAllInstances()`
- [x] Logs de debug adicionados
- [x] Documentação completa
- [ ] Teste com usuário (aguardando validação)
- [ ] WebSocket em tempo real (FASE 3)

---

**Status:** ✅ **BUG CORRIGIDO**  
**Testado:** ⏳ **Aguardando validação do usuário**  
**Próximo:** 🚀 **FASE 3 - WebSocket Real-Time**
