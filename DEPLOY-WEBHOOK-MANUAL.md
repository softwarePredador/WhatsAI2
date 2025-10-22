# Manual de Deploy - Webhook Receiver no Digital Ocean

## 📋 Pré-requisitos
- Acesso SSH ao servidor Digital Ocean (143.198.230.247)
- Node.js e npm instalados no servidor
- PM2 para gerenciar processos (opcional)

## 🚀 Deploy Manual

### 1. Conectar ao servidor
```bash
ssh root@143.198.230.247
```

### 2. Criar diretório do projeto
```bash
mkdir -p /opt/webhook-receiver
cd /opt/webhook-receiver
```

### 3. Criar package.json
```bash
cat > package.json << 'EOF'
{
  "name": "webhook-receiver",
  "version": "1.0.0",
  "description": "Webhook receiver for WhatsAI",
  "main": "webhook-receiver.js",
  "scripts": {
    "start": "node webhook-receiver.js",
    "dev": "nodemon webhook-receiver.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "@prisma/client": "^5.0.0",
    "prisma": "^5.0.0"
  }
}
EOF
```

### 4. Instalar dependências
```bash
npm install
```

### 5. Criar schema.prisma
```bash
cat > schema.prisma << 'EOF'
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id       String @id @default(cuid())
  username String @unique
  password String
  
  conversations Conversation[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@map("users")
}

model Instance {
  id             String  @id @default(cuid())
  instanceName   String  @unique
  instanceId     String? @unique
  qrCode         String?
  status         String  @default("DISCONNECTED")
  profilePicUrl  String?
  profileName    String?
  profileStatus  String?
  
  conversations Conversation[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@map("instances")
}

model Conversation {
  id          String @id @default(cuid())
  instanceId  String
  chatId      String
  chatName    String?
  isGroup     Boolean @default(false)
  lastMessage String?
  timestamp   DateTime @default(now())
  
  userId      String?
  user        User?     @relation(fields: [userId], references: [id])
  instance    Instance  @relation(fields: [instanceId], references: [id])
  messages    Message[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([instanceId, chatId])
  @@map("conversations")
}

model Message {
  id             String   @id @default(cuid())
  conversationId String
  messageId      String   @unique
  fromMe         Boolean  @default(false)
  body           String?
  type           String   @default("text")
  timestamp      DateTime @default(now())
  
  conversation Conversation @relation(fields: [conversationId], references: [id])
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@map("messages")
}
EOF
```

### 6. Configurar variável de ambiente
```bash
export DATABASE_URL="postgres://postgres:78ffa3b05805066f6719@banco_halder-db:5432/halder?sslmode=disable"
```

### 7. Gerar Prisma Client
```bash
npx prisma generate
```

### 8. Copiar webhook-receiver.js
> **Nota**: Copie o conteúdo do arquivo `webhook-receiver.js` criado anteriormente

### 9. Testar o webhook
```bash
node webhook-receiver.js
```

### 10. Usar PM2 para produção (recomendado)
```bash
# Instalar PM2 globalmente (se não instalado)
npm install -g pm2

# Iniciar com PM2
pm2 start webhook-receiver.js --name webhook-receiver

# Salvar configuração do PM2
pm2 save

# Configurar PM2 para iniciar no boot
pm2 startup
```

## 🔧 URLs Importantes

### Webhook URL para Evolution API:
```
http://143.198.230.247:3001/api/webhooks/evolution/cmh250j8e0001s1sh1i19esvz
```

### Health Check:
```
http://143.198.230.247:3001/health
```

## 🛡️ Configuração de Firewall (se necessário)
```bash
# Permitir porta 3001
ufw allow 3001
```

## 📊 Monitoramento
```bash
# Ver logs do PM2
pm2 logs webhook-receiver

# Ver status
pm2 status

# Reiniciar
pm2 restart webhook-receiver
```

## ⚠️ Troubleshooting

### Erro de porta ocupada:
```bash
# Verificar quem está usando a porta
lsof -i :3001

# Matar processo se necessário
kill -9 <PID>
```

### Problemas com DATABASE_URL:
- Verificar se a variável está definida: `echo $DATABASE_URL`
- Para persistir, adicionar ao ~/.bashrc ou ~/.profile

### Problemas com Prisma:
```bash
# Regenerar client
npx prisma generate

# Verificar schema
npx prisma validate
```