# BUG FIX: Instance Service Memory Cache

## 🐛 Problema Identificado

**Erro**: `Instance not found` ao tentar conectar instância após criar

**Causa Raiz**: O `instance-service.ts` usava apenas cache em memória (Map) sem persistência. Quando o servidor reiniciava ou a instância era criada, ela não estava acessível pelos métodos `connectInstance`, `disconnectInstance`, etc.

## 🔍 Análise Técnica

### Problema 1: Key Incorreta no Cache
```typescript
// ANTES (ERRADO)
const instance = await this.repository.create({...});
this.instances.set(instanceId, instance); // ❌ instanceId é UUID gerado antes do banco
```

O `instanceId` era gerado antes de criar no banco, mas o `instance.id` real vinha do Prisma. A key do Map não coincidia com o ID real.

### Problema 2: Métodos Não Consultavam Banco
```typescript
// ANTES (ERRADO)
async getAllInstances(): Promise<WhatsAppInstance[]> {
  return Array.from(this.instances.values()); // ❌ Só retorna o que está na memória
}

async getInstanceById(instanceId: string): Promise<WhatsAppInstance | null> {
  return this.instances.get(instanceId) || null; // ❌ Só busca na memória
}
```

Se o servidor reiniciasse, a Map ficava vazia e nenhuma instância era encontrada, mesmo existindo no banco.

## ✅ Solução Implementada

### Fix 1: Usar ID Correto do Banco
```typescript
// DEPOIS (CORRETO)
const instance = await this.repository.create({...});
this.instances.set(instance.id, instance); // ✅ Usa o ID real do banco
```

### Fix 2: Hybrid Cache Strategy (Memory + Database)
```typescript
// DEPOIS (CORRETO)
async getAllInstances(): Promise<WhatsAppInstance[]> {
  // If cache is empty, load from database
  if (this.instances.size === 0) {
    const dbInstances = await this.repository.findAll();
    dbInstances.forEach(instance => {
      this.instances.set(instance.id, instance);
    });
  }
  return Array.from(this.instances.values());
}

async getInstanceById(instanceId: string): Promise<WhatsAppInstance | null> {
  // Try to get from cache first
  let instance = this.instances.get(instanceId) || null;
  
  // If not in cache, try database
  if (!instance) {
    const dbInstance = await this.repository.findById(instanceId);
    if (dbInstance) {
      this.instances.set(dbInstance.id, dbInstance);
      instance = dbInstance;
    }
  }
  
  return instance;
}
```

### Fix 3: Atualizar Métodos para Usar getInstanceById
```typescript
// connectInstance
const instance = await this.getInstanceById(instanceId); // ✅ Busca no cache ou banco
if (!instance) {
  throw new Error('Instance not found');
}

// disconnectInstance
const instance = await this.getInstanceById(instanceId); // ✅ Busca no cache ou banco

// deleteInstance  
const instance = await this.getInstanceById(instanceId); // ✅ Busca no cache ou banco
await this.repository.delete(instanceId); // ✅ Deleta do banco também
```

## 📊 Impacto da Correção

### Antes (Broken)
```
1. Criar instância → Salva no banco ✅
2. Adiciona ao cache com key errada ❌
3. Servidor continua rodando → Funciona parcialmente
4. Servidor reinicia → Cache vazio
5. Tentar conectar → "Instance not found" ❌
```

### Depois (Fixed)
```
1. Criar instância → Salva no banco ✅
2. Adiciona ao cache com key correta ✅
3. Servidor continua rodando → Funciona ✅
4. Servidor reinicia → Cache vazio
5. getAllInstances() → Carrega do banco automaticamente ✅
6. Tentar conectar → Busca no cache ou banco ✅
```

## 🧪 Evidência da Correção

### Log ANTES do Fix
```
[BACK] 📱 Loaded 0 instances from database
[BACK] Evolution API Response: 201 /instance/create
[BACK] Error connecting instance: Error: Instance not found ❌
```

### Log DEPOIS do Fix
```
[BACK] 📱 Loaded 1 instances from database ✅
[BACK] (Pronto para conectar instância)
```

## 📝 Arquivos Modificados

**server/src/services/instance-service.ts**
- ✅ Corrigida key do cache (linha ~71)
- ✅ Método `getAllInstances` com fallback para banco (linhas ~102-110)
- ✅ Método `getInstanceById` com fallback para banco (linhas ~112-124)
- ✅ Método `connectInstance` usa `getInstanceById` (linha ~133)
- ✅ Método `disconnectInstance` usa `getInstanceById` (linha ~193)
- ✅ Método `deleteInstance` usa `getInstanceById` + deleta do banco (linhas ~129,137)
- ✅ Método `getQRCode` usa `getInstanceById` (linha ~220)

## 🎯 Pattern Implementado: **Hybrid Cache**

```
┌─────────────────────────────────────────┐
│         Request (GET/POST/DELETE)       │
└──────────────────┬──────────────────────┘
                   │
         ┌─────────▼─────────┐
         │  getInstanceById  │
         └─────────┬─────────┘
                   │
        ┌──────────▼──────────┐
        │  Check Memory Cache │
        └──────────┬──────────┘
                   │
        ┌──────────▼───────────┐
        │  Found in cache?     │
        └─┬────────────────┬───┘
    YES   │                │ NO
          │                │
   ┌──────▼──────┐  ┌──────▼──────────┐
   │ Return from │  │ Query Database  │
   │   Cache     │  └──────┬──────────┘
   └─────────────┘         │
                    ┌──────▼──────────┐
                    │   Found in DB?  │
                    └─┬────────────┬──┘
                 YES  │            │ NO
                      │            │
              ┌───────▼───────┐   │
              │ Add to Cache  │   │
              └───────┬───────┘   │
                      │            │
              ┌───────▼────────────▼──┐
              │   Return Instance     │
              │   (or null)           │
              └───────────────────────┘
```

## 🔐 Benefícios da Solução

1. **Performance**: Cache em memória para acesso rápido
2. **Persistência**: Dados não são perdidos ao reiniciar
3. **Confiabilidade**: Sempre consulta o banco como fallback
4. **Consistência**: Key do cache sempre coincide com ID do banco
5. **Escalabilidade**: Fácil adicionar Redis/Memcached no futuro

## 🚀 Próximos Passos (Opcional)

Para produção, considerar:
- [ ] Implementar TTL no cache (expiração automática)
- [ ] Adicionar Redis para cache distribuído
- [ ] Implementar cache invalidation strategy
- [ ] Monitorar hit rate do cache
- [ ] Adicionar cache warming no startup

## ✅ Resumo

**Problema**: Instance not found após criar  
**Causa**: Cache em memória + key incorreta + sem fallback para banco  
**Solução**: Hybrid cache strategy com database fallback  
**Status**: ✅ **RESOLVIDO**  
**Data**: 2025-10-18
