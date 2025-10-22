# Deploy WhatsAI Backend no EasyPanel

## 1. Criar novo projeto no EasyPanel

1. Acesse: http://143.198.230.247:3000/
2. Vá em "Projects" → "Create Project"
3. Nome: `whatsai-backend`

## 2. Adicionar serviço

1. Dentro do projeto → "Add Service" → "App"
2. Configure:
   - **Name**: `whatsai-api`
   - **Source**: GitHub Repository
   - **Repository**: `https://github.com/softwarePredador/WhatsAI2`
   - **Branch**: `main`
   - **Build Path**: `/server`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

## 3. Configurar variáveis de ambiente

```env
NODE_ENV=production
PORT=3001

# Evolution API Configuration
EVOLUTION_API_URL=http://143.198.230.247:8080
EVOLUTION_API_KEY=Pz6qEerZE5IYwaoc8ZCQxmBdLAinX4dl

# JWT Configuration
JWT_SECRET=whatsai-super-secret-jwt-key-2024

# Database Configuration
DATABASE_URL="postgresql://postgres.viqjmhlxsqqoqimglxar:xitao3275rafa@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.viqjmhlxsqqoqimglxar:xitao3275rafa@aws-1-us-east-1.pooler.supabase.com:5432/postgres"
```

## 4. Configurar domínio

1. Vá em "Domains" no seu app
2. Adicione um domínio como: `whatsai-api.seudominio.com`
3. Ou use o domínio padrão do EasyPanel

## 5. Webhook URL será:

```
https://whatsai-api.seudominio.com/api/webhooks/evolution/{instanceId}
```

Ou com IP direto:
```
http://143.198.230.247:PORT/api/webhooks/evolution/{instanceId}
```