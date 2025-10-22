# 🚀 Setup WhatsAI em Outro PC - Guia Completo

Este guia contém **TODAS** as configurações sensíveis e arquivos que não vão para o Git (`.gitignore`) para você continuar o desenvolvimento em outro PC.

---

## 📋 **CHECKLIST DE SETUP**

### **1. Clone o Repositório**
```bash
git clone https://github.com/rafaelhalder/WhatsAI2.git
cd WhatsAI2
```

---

## 🔐 **ARQUIVOS DE CONFIGURAÇÃO (.env)**

### **📁 Backend - `server/.env`**

Crie o arquivo `server/.env` com o seguinte conteúdo:

```env
# Application Configuration
NODE_ENV=development
PORT=3001

# Evolution API Configuration
EVOLUTION_API_URL=https://hsapi.studio/
EVOLUTION_API_KEY=Pz6qEerZE5IYwaoc8ZCQxmBdLAinX4dl

# JWT Configuration (for future authentication)
JWT_SECRET=whatsai-super-secret-jwt-key-2024

# Database Configuration - Supabase with connection pooling
DATABASE_URL="postgresql://postgres.viqjmhlxsqqoqimglxar:xitao3275rafa@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.viqjmhlxsqqoqimglxar:xitao3275rafa@aws-1-us-east-1.pooler.supabase.com:5432/postgres"

# WebSocket Configuration (optional)
# WEBSOCKET_PORT=3001
```

---

### **📁 Frontend - `client/.env`**

Crie o arquivo `client/.env` com o seguinte conteúdo:

```env
# Use relative URL for development (Vite proxy will forward to backend)
# In production, set this to your backend URL
VITE_API_URL=/api
```

---

## 🗄️ **BANCO DE DADOS**

### **Opção 1: SQLite (Desenvolvimento Local)**

O schema atual usa SQLite (arquivo `server/prisma/dev.db`).

**Passos:**

1. Navegue até o diretório do servidor:
```bash
cd server
```

2. Instale as dependências:
```bash
npm install
```

3. Gere o Prisma Client:
```bash
npx prisma generate
```

4. Crie o banco de dados e rode as migrations:
```bash
npx prisma db push
```

5. (Opcional) Popular o banco com dados de exemplo:
```bash
npm run seed
```

**⚠️ IMPORTANTE:** O arquivo `dev.db` NÃO vai para o Git (está no `.gitignore`). 
Você precisa criar um novo banco ou copiar o arquivo `dev.db` manualmente.

---

### **Opção 2: PostgreSQL (Supabase - Produção)**

Se quiser usar o PostgreSQL do Supabase (já configurado no `.env` acima):

1. Troque o datasource no `server/prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

2. Rode as migrations:
```bash
cd server
npx prisma migrate dev --name init
```

3. Gere o client:
```bash
npx prisma generate
```

---

## 📦 **INSTALAÇÃO DE DEPENDÊNCIAS**

### **Backend:**
```bash
cd server
npm install
```

### **Frontend:**
```bash
cd client
npm install
```

### **Root (para scripts concurrentes):**
```bash
cd ..  # Voltar para raiz
npm install
```

---

## 🚀 **INICIAR O PROJETO**

### **Desenvolvimento (Front + Back juntos):**
```bash
# Na raiz do projeto
npm run dev
```

Isso vai iniciar:
- ✅ **Frontend:** http://localhost:3000 (Vite)
- ✅ **Backend:** http://localhost:3001 (Express)

### **Iniciar separadamente:**

**Backend apenas:**
```bash
cd server
npm run dev
```

**Frontend apenas:**
```bash
cd client
npm run dev
```

---

## 🔑 **CREDENCIAIS E CHAVES IMPORTANTES**

### **Evolution API:**
- **URL:** https://hsapi.studio/
- **API Key:** `Pz6qEerZE5IYwaoc8ZCQxmBdLAinX4dl`

### **JWT Secret:**
- **Secret:** `whatsai-super-secret-jwt-key-2024`

### **Supabase (PostgreSQL):**
- **Host:** `aws-1-us-east-1.pooler.supabase.com`
- **Database:** `postgres`
- **User:** `postgres.viqjmhlxsqqoqimglxar`
- **Password:** `xitao3275rafa`
- **Connection Pooling Port:** `6543` (para queries)
- **Direct Port:** `5432` (para migrations)

---

## 📝 **ARQUIVOS QUE NÃO VÃO PARA O GIT**

Estes arquivos estão no `.gitignore` e **NÃO** serão versionados:

### **Variáveis de Ambiente:**
- ❌ `server/.env`
- ❌ `client/.env`
- ❌ `.env.local`
- ❌ `.env.production`

### **Banco de Dados:**
- ❌ `server/prisma/dev.db` (SQLite - precisa criar novo)
- ❌ `server/prisma/migrations/` (migrações podem ser recriadas)

### **Node Modules:**
- ❌ `node_modules/` (root)
- ❌ `server/node_modules/`
- ❌ `client/node_modules/`

### **Build Outputs:**
- ❌ `client/dist/`
- ❌ `server/build/`
- ❌ `.vite/` (cache do Vite)

### **Logs e Temporários:**
- ❌ `*.log`
- ❌ `tmp/`
- ❌ `temp/`

### **Editor:**
- ❌ `.vscode/settings.json`
- ❌ `.idea/`

### **QR Codes:**
- ❌ `qr-codes/`
- ❌ `*.png`, `*.jpg`, `*.jpeg` (QR codes gerados)

---

## 🛠️ **CONFIGURAÇÕES ADICIONAIS**

### **VSCode Settings (Opcional):**

Se quiser as mesmas configurações do VSCode, crie `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

---

## ✅ **CHECKLIST FINAL**

Antes de começar a trabalhar, verifique:

- [x] Repositório clonado
- [x] `server/.env` criado com todas as variáveis
- [x] `client/.env` criado
- [x] `npm install` rodado na raiz
- [x] `npm install` rodado em `server/`
- [x] `npm install` rodado em `client/`
- [x] Banco de dados criado (`npx prisma db push` ou `prisma migrate dev`)
- [x] Prisma Client gerado (`npx prisma generate`)
- [x] Servidor iniciado (`npm run dev`)
- [x] Frontend acessível em http://localhost:3000
- [x] Backend acessível em http://localhost:3001

---

## 🎯 **PRÓXIMA FASE: Backend API para Settings**

Quando voltar a trabalhar, a próxima tarefa é:

### **FASE 5: Backend API - Persistência de Settings**

**O que fazer:**

1. **Atualizar Prisma Schema** - Adicionar modelo `UserSettings`:
```prisma
model UserSettings {
  id        String   @id @default(cuid())
  userId    String   @unique
  settings  String   // JSON stringificado
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_settings")
}
```

2. **Criar Endpoints Backend:**
   - `GET /api/user/settings` - Buscar settings
   - `PUT /api/user/settings` - Atualizar settings
   - `POST /api/user/settings/sync` - Sincronizar localStorage → DB

3. **Integrar Frontend:**
   - Fetch settings do backend no login
   - Salvar no banco ao clicar "Salvar Configurações"

**Tempo estimado:** 2-3 horas

---

## 🆘 **PROBLEMAS COMUNS**

### **Erro: Port 3000 or 3001 already in use**
```bash
# Windows (PowerShell)
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### **Erro: Prisma Client not generated**
```bash
cd server
npx prisma generate
```

### **Erro: Database connection failed**
- Verifique se o `.env` tem as URLs corretas
- Teste a conexão com: `npx prisma db pull`

---

## 📞 **SUPORTE**

Se tiver qualquer problema, você tem:
- ✅ Evolution API rodando em: https://hsapi.studio/
- ✅ Supabase PostgreSQL configurado
- ✅ Todas as credenciais neste arquivo

**Boa sorte! 🚀**
