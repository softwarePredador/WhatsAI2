# 📊 Guia de Configuração do Monitoramento

## ✅ O que foi instalado:

### 1. **Morgan** - HTTP Request Logger
- ✅ Já configurado e ativo
- Logs coloridos por status (INFO, WARN, ERROR)
- Não loga requests para `/health` (evita poluir logs)
- Modo development: mostra request body (sem passwords)

### 2. **Sentry** - Error Tracking & Performance Monitoring
- ✅ Instalado
- ✅ **CONFIGURADO E ATIVO!**
- DSN: `...549126a90@...sentry.io/...831424` (configurado)

---

## 🎉 Sentry já está ATIVO!

**Não precisa fazer nada!** Já configuramos tudo para você:
- ✅ DSN configurado
- ✅ Profiling ativado
- ✅ Error tracking automático
- ✅ Performance monitoring
- ✅ Logs estruturados

Acesse seu dashboard: **https://sentry.io/organizations/whatsai/issues/**

---

## 🧪 Testar Sentry (opcional):

```bash
cd server
npx tsx src/test-sentry.ts
```

Este script vai enviar eventos de teste para o Sentry:
- 📝 Info log
- ⚠️ Warning
- ❌ Error com contexto
- ⚡ Performance span

Depois veja no dashboard: https://sentry.io/organizations/whatsai/issues/

---

## 🚀 Como usar (já está funcionando!):

O Sentry já está capturando automaticamente:
- ✅ Todos os erros não tratados
- ✅ Requisições HTTP com erro (4xx, 5xx)
- ✅ Performance de todas as operações
- ✅ Logs estruturados

**Não precisa fazer mais nada!** Só usar o sistema normalmente.

---

## 📈 O que você tem disponível:

### Passo 3: Configurar no seu `.env`
```bash
# server/.env
SENTRY_DSN=https://abc123def456@o123456.ingest.sentry.io/7890123
```

### Passo 4: Reiniciar o servidor
```bash
cd server
npm run dev
```

Você verá:
```
✅ Sentry monitoring initialized
```

---

## 📈 O que você vai ter:

### 1. **Logs Detalhados (Morgan)**
```
[INFO] GET /api/instances 200 45.2 ms - {}
[WARN] POST /api/instances 404 12.3 ms - {"name":"test"}
[ERROR] POST /api/send-message 500 234.1 ms - {"phone":"555..."}
```

### 2. **Error Tracking (Sentry)**
- 🐛 Stack traces completas de erros
- 📊 Estatísticas de frequência de erros
- 🔔 Alertas por email quando erros acontecem
- 🕐 Timeline de quando erros ocorreram
- 👤 Quantos usuários foram afetados

### 3. **Performance Monitoring**
- ⏱️ Tempo de resposta de cada endpoint
- 🐌 Endpoints mais lentos identificados automaticamente
- 📉 Gráficos de performance ao longo do tempo

---

## 🎯 Exemplos de uso:

### Ver erros no Sentry:
1. Acesse https://sentry.io
2. Vá em "Issues"
3. Veja todos os erros com:
   - Stack trace completa
   - Request que causou o erro
   - Quantas vezes aconteceu
   - Últimas ocorrências

### Capturar erro manualmente:
```typescript
import * as Sentry from '@sentry/node';

try {
  // Seu código
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      feature: 'send-message',
      instanceId: instance.id
    },
    extra: {
      phoneNumber: phone,
      messageContent: message
    }
  });
  throw error;
}
```

### Adicionar contexto ao erro:
```typescript
Sentry.setUser({
  id: user.id,
  email: user.email
});

Sentry.setContext('whatsapp', {
  instanceId: instance.id,
  instanceName: instance.name,
  status: instance.status
});
```

---

## 🔥 Benefícios Imediatos:

1. **Você descobre erros antes dos usuários reclamarem**
   - Sentry envia email quando erro novo acontece

2. **Debug muito mais rápido**
   - Stack trace completa com linha exata do erro
   - Request completo (headers, body, query)
   - Estado da aplicação no momento do erro

3. **Identifica padrões**
   - "Esse erro só acontece com instância X"
   - "Erro aumentou 500% nas últimas 2 horas"
   - "50 usuários afetados pelo mesmo bug"

4. **Performance insights**
   - "Endpoint /api/send-message está levando 2 segundos"
   - "Database query está lento"
   - "Comparação antes/depois de otimizações"

---

## 📝 Logs sem Sentry (apenas Morgan):

Se não configurar Sentry, você ainda terá:
- ✅ Logs HTTP com status e tempo de resposta
- ✅ Logs coloridos (INFO/WARN/ERROR)
- ✅ Request body nos logs (development)
- ✅ Logs de erro no console

Mas **não terá**:
- ❌ Interface web para visualizar erros
- ❌ Alertas automáticos
- ❌ Estatísticas e gráficos
- ❌ Tracking de performance

---

## 🆓 Plano gratuito do Sentry:

- ✅ 5.000 erros/mês
- ✅ 10.000 performance transactions/mês
- ✅ 1 projeto
- ✅ 1 membro da equipe
- ✅ 30 dias de retenção de dados
- ✅ Alertas por email
- ✅ Integração com Slack/Discord

**Para seu projeto, é mais que suficiente!**

---

## 🔧 Alternativas ao Sentry:

Se não quiser usar Sentry, você pode:

### 1. **Apenas Morgan** (já ativo)
- Gratuito, ilimitado
- Logs no terminal/arquivo
- Sem interface web

### 2. **LogRocket** (alternativa ao Sentry)
- Similar ao Sentry
- Tem replay de sessão (vê o que usuário fez)
- Plano grátis: 1.000 sessões/mês

### 3. **Rollbar**
- Similar ao Sentry
- Plano grátis: 5.000 eventos/mês

### 4. **Winston + Arquivo**
- Salvar logs em arquivos `.log`
- Usar `tail -f logs/app.log` pra ver em tempo real

---

## 📞 Dúvidas?

Sentry não é obrigatório, mas **altamente recomendado** para:
- ✅ Produção
- ✅ Projetos com múltiplos usuários
- ✅ Debugging remoto (erros em servidor que você não tem acesso)

Para desenvolvimento local, o **Morgan** já é suficiente! 🚀
