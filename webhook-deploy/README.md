# WhatsAI Webhook Receiver

Microserviço para receber webhooks de múltiplas instâncias Evolution API e salvar no PostgreSQL.

## 📦 Deploy no Easypanel (Nixpacks)

### 1. Preparar o Banco de Dados
No Easypanel, crie um serviço **PostgreSQL** primeiro:
- Nome: `whatsai-db` (ou qualquer nome)
- Anote a `DATABASE_URL` gerada

### 2. Fazer Upload do Projeto
1. Compacte esta pasta em ZIP (webhook-receiver.zip)
2. No Easypanel, crie um novo **App**
3. Escolha **Source: Upload**
4. Faça upload do ZIP

### 3. Configurar Variáveis de Ambiente
No Easypanel, adicione as seguintes variáveis:

```env
DATABASE_URL=postgresql://user:password@host:5432/database
NODE_ENV=production
PORT=3002
```

> **Importante:** Use a `DATABASE_URL` do PostgreSQL que você criou no passo 1

### 4. Deploy Automático
O Nixpacks vai:
1. Detectar Node.js automaticamente
2. Executar `npm install`
3. Executar `npm run postinstall` (gera Prisma Client)
4. Executar `npm start`

### 5. Configurar Webhook nas Instâncias Evolution API

Após o deploy, você terá uma URL tipo:
```
https://seu-webhook.easypanel.host
```

Configure nas suas instâncias Evolution API:
```
POST https://seu-webhook.easypanel.host/api/webhooks/evolution/INSTANCE_ID
```

## 📡 Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/webhooks/evolution/:instanceId` | Recebe webhooks de uma instância |
| GET | `/health` | Health check do serviço |
| GET | `/` | Documentação da API |

## 🧪 Testar

```bash
# Health check
curl https://seu-webhook.easypanel.host/health

# Teste de webhook
curl -X POST https://seu-webhook.easypanel.host/api/webhooks/test \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

## 🗄️ Banco de Dados

O webhook usa o mesmo schema do servidor principal (`server/prisma/schema.prisma`).

**Modelos principais:**
- `WhatsAppInstance` - Instâncias conectadas
- `Message` - Mensagens recebidas
- `Conversation` - Conversas/chats

## 🔧 Desenvolvimento Local (Opcional)

```bash
# Instalar dependências
npm install

# Configurar .env
cp .env.example .env
# Edite .env com suas credenciais

# Gerar Prisma Client
npx prisma generate

# Rodar
npm start
```

## 📝 Logs

Os logs aparecem no console do Easypanel. Procure por:
- `✅ Conexão com PostgreSQL OK` - Banco conectado
- `📨 Webhook recebido` - Webhook processado
- `✅ Mensagem salva` - Dados salvos com sucesso

## ⚠️ Troubleshooting

### Erro de conexão com banco
- Verifique se `DATABASE_URL` está correta
- Confirme que o PostgreSQL está rodando
- Teste a conexão: `GET /health`

### Webhook não recebe dados
- Verifique se a URL está correta na Evolution API
- Confirme que `:instanceId` no path está correto
- Veja os logs no Easypanel

### Instância não encontrada
- Certifique-se que a instância existe no banco
- O `evolutionInstanceName` deve ser igual ao `:instanceId` da URL

## 🚀 Versão

**v2.0** - Otimizado para Easypanel com Nixpacks
