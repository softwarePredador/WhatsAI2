# 🏗️ WhatsAI Monorepo

Estrutura monorepo completa com Frontend (React) e Backend (Node.js) integrados.

## 📁 Estrutura do Projeto

```
WhatsAI2/
├── client/              # Frontend React + Vite
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
├── server/              # Backend Node.js + Express
│   ├── src/
│   ├── prisma/
│   ├── package.json
│   └── tsconfig.json
├── package.json         # Root package (scripts monorepo)
└── README.md
```

## 🚀 Início Rápido

### Instalação

```bash
# Instalar todas as dependências (root, server e client)
npm run install:all

# Ou instalar manualmente
npm install
cd server && npm install
cd ../client && npm install
```

### Desenvolvimento

```bash
# Iniciar frontend E backend simultaneamente
npm run dev

# Ou iniciar separadamente:
npm run dev:server  # Backend em http://localhost:5173
npm run dev:client  # Frontend em http://localhost:3000
```

### Build para Produção

```bash
# Build de tudo
npm run build

# Build separado
npm run build:server
npm run build:client
```

### Outros Comandos

```bash
# Iniciar apenas o servidor (produção)
npm start

# Limpar node_modules e builds
npm run clean
```

## 📦 Tecnologias

### Frontend (client/)
- React 19
- TypeScript
- Vite
- TailwindCSS + DaisyUI
- React Router DOM
- Axios
- Zustand (state management)
- React Hook Form + Zod

### Backend (server/)
- Node.js + Express
- TypeScript
- Prisma ORM (SQLite/PostgreSQL)
- Socket.io
- Evolution API integration
- JWT Authentication

## 🔗 Endpoints

### Backend API
- Base URL: `http://localhost:5173/api`
- Auth: `/api/auth/login`, `/api/auth/register`
- Instances: `/api/instances`
- WebSocket: `http://localhost:5173`

### Frontend
- Dev URL: `http://localhost:3000`
- Build output: `client/dist/`

## 📝 Configuração

### Backend (.env em server/)
```env
NODE_ENV=development
PORT=5173
EVOLUTION_API_URL=https://hsapi.studio/
EVOLUTION_API_KEY=your-key
DATABASE_URL=file:./dev.db
JWT_SECRET=your-secret
```

### Frontend (.env em client/)
```env
VITE_API_URL=http://localhost:5173/api
```

## 🐳 Docker

```bash
# Build e rodar com Docker Compose
cd server
docker-compose up --build -d
```

## 📚 Documentação

- [Análise do Projeto](ANALISE-PROJETO.md)
- [Guia de Integração](INTEGRACAO-FRONTEND.md)
- [Guia Docker](DOCKER-GUIDE.md)
- [Guia Prisma](PRISMA-GUIDE.md)
- [Correções de Segurança](SECURITY-FIXES.md)

## 🎯 Status do Projeto

- ✅ Backend: Funcional
- ✅ Frontend: Integrado
- 🔄 Autenticação: Em implementação
- ✅ Docker: Configurado
- ✅ Monorepo: Estruturado

## 🤝 Contribuindo

1. Clone o repositório
2. Instale as dependências: `npm run install:all`
3. Inicie o desenvolvimento: `npm run dev`
4. Faça suas alterações
5. Commit e push

## 📄 Licença

MIT License - veja o arquivo [LICENSE](LICENSE) para detalhes.
