# ✅ Configuração do Banco de Dados - COMPLETA

## 📊 Informações do Banco Easypanel

### Credenciais
- **Usuário:** postgres
- **Senha:** 78ffa3b05805066f6719
- **Database:** halder
- **Host Interno:** banco_halder-db (para Docker)
- **Host Externo:** 143.198.230.247
- **Porta:** 5432

### Connection Strings

#### Para desenvolvimento local (seu computador)
```env
DATABASE_URL="postgres://postgres:78ffa3b05805066f6719@143.198.230.247:5432/halder?sslmode=disable"
DIRECT_URL="postgres://postgres:78ffa3b05805066f6719@143.198.230.247:5432/halder?sslmode=disable"
```

#### Para produção (dentro do Docker/Easypanel)
```env
DATABASE_URL="postgres://postgres:78ffa3b05805066f6719@banco_halder-db:5432/halder?sslmode=disable"
```

---

## ✅ Status da Configuração

### 1. Server (WhatsAI2)
- **Arquivo:** `server/.env`
- **Status:** ✅ Configurado com IP externo (143.198.230.247)
- **Prisma Schema:** ✅ Sincronizado
- **Conexão:** ✅ Testada e funcionando
- **Seed:** ✅ Usuário admin criado

### 2. Webhook (Easypanel)
- **Arquivo:** `webhook-deploy/index.js`
- **Status:** ✅ Hardcoded com host interno (banco_halder-db)
- **Deployment:** ✅ Rodando em https://teta-webhook.8ktevp.easypanel.host/
- **Conexão:** ✅ Funcionando no Easypanel

---

## 📝 Usuário Admin Criado

```
Email: admin@whatsai.com
Senha: admin123
Role: ADMIN
Status: Ativo
```

---

## 🎯 Estado Atual do Banco

```
👥 Usuários: 1 (Admin User)
📱 Instâncias: 0 (todas deletadas - começando do zero)
💬 Mensagens: 0
```

---

## 🚀 Próximos Passos

1. **Criar nova instância via WhatsAI**
   - Webhook será automaticamente configurado
   - URL: `https://teta-webhook.8ktevp.easypanel.host/api/webhooks/evolution/{nome-instancia}`

2. **Verificar logs do webhook**
   - Acessar Easypanel > teta-webhook > Logs
   - Confirmar recebimento de eventos

3. **Testar fluxo completo**
   - Escanear QR Code
   - Enviar mensagem de teste
   - Verificar se mensagem aparece no banco

---

## 🔧 Comandos Úteis

### Testar conexão com o banco
```bash
cd server
npx tsx scripts/test-db-connection.ts
```

### Sincronizar schema Prisma
```bash
cd server
npx prisma db push
```

### Recriar usuário admin
```bash
cd server
npx tsx prisma/seed.ts
```

### Deletar todas as instâncias
```bash
cd server
npx tsx scripts/delete-all-instances.ts
```

---

## ⚠️ Importante

**Desenvolvimento Local vs Produção:**
- **Local:** Usa IP externo `143.198.230.247:5432`
- **Easypanel:** Usa host interno `banco_halder-db:5432`

O webhook no Easypanel já está configurado corretamente com o host interno!

---

## 🎉 Tudo Pronto!

✅ Banco de dados configurado  
✅ Prisma sincronizado  
✅ Usuário admin criado  
✅ Webhook configurado  
✅ Todas as instâncias deletadas  
✅ Pronto para começar do ZERO!  
