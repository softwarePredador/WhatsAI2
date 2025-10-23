# WhatsAI Webhook Receiver - Deploy Easypanel

## ⚡ Deploy Rápido

### 1. Configure o DATABASE_URL no Easypanel

No painel do seu app, adicione a variável de ambiente:

```env
DATABASE_URL=postgres://postgres:SUA_SENHA@banco_halder-db:5432/halder?sslmode=disable
PORT=3002
```

### 2. Build e Deploy

O Easypanel vai automaticamente:
1. Detectar Node.js
2. Rodar `npm install`
3. Rodar `npx prisma generate`
4. Iniciar com `node index.js`

## 🔗 Configurar Webhook na Evolution API

Após o deploy, use a URL:
```
https://seu-app.easypanel.host/api/webhooks/evolution/INSTANCE_ID
```

Substitua `INSTANCE_ID` pelo ID da sua instância.

## 📡 Endpoints

- `POST /api/webhooks/evolution/:instanceId` - Recebe webhooks
- `GET /health` - Health check
- `GET /` - Info do serviço

## 🐛 Troubleshooting

### Erro de conexão com banco
Certifique-se que:
- O PostgreSQL está rodando
- DATABASE_URL está correta
- O nome do serviço do banco está correto (`banco_halder-db`)

### Build falha
Verifique se tem `package.json` e `prisma/schema.prisma` no root

### Porta em uso
O Easypanel geralmente usa variável `PORT` automática, mas você pode forçar com a env var
