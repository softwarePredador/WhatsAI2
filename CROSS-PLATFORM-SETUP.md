# 🔧 Configuração Cross-Platform (Windows + Mac)

## ✅ Mudanças Implementadas

### Package.json Raiz Atualizado
- ✅ Removido PowerShell (específico Windows)
- ✅ Adicionado `rimraf` para limpeza cross-platform
- ✅ Comando `kill:ports` funciona em ambos OS
- ✅ Novo script `dev:no-tunnel` (sem ngrok)

## 🚀 Comandos Disponíveis

### Desenvolvimento
```bash
# Iniciar tudo (backend + frontend + ngrok)
npm run dev

# Iniciar sem ngrok (desenvolvimento local)
npm run dev:no-tunnel

# Apenas backend
npm run dev:server

# Apenas frontend
npm run dev:client

# Apenas ngrok (porta 3001)
npm run tunnel
```

### Limpeza
```bash
# Limpar portas 3000 e 3001
npm run kill:ports

# Limpar node_modules e dist (cross-platform)
npm run clean

# Reinstalar tudo
npm run install:all
```

### Build e Deploy
```bash
# Build completo
npm run build

# Iniciar produção
npm start
```

## 📋 Pré-requisitos

### Windows
- Node.js 18+
- npm 9+
- ngrok (opcional): `choco install ngrok` ou baixar de ngrok.com

### Mac
- Node.js 18+
- npm 9+
- ngrok (opcional): `brew install ngrok`

## 🔥 Primeira Instalação

```bash
# 1. Instalar dependências
npm run install:all

# 2. Configurar backend
cd server
cp .env.example .env
# Editar .env com suas credenciais

# 3. Configurar banco de dados
npm run db:generate
npm run db:push

# 4. Voltar para raiz e iniciar
cd ..
npm run dev
```

## 🌐 Ngrok Configuration

### First Time Setup (Required for webhooks)

**Get your authtoken:**
1. Go to https://dashboard.ngrok.com/get-started/your-authtoken
2. Copy your authtoken
3. Run the command below

### Configurar ngrok authtoken (primeira vez)

**Mac/Linux:**
```bash
# Install ngrok
brew install ngrok

# Add your authtoken
ngrok config add-authtoken YOUR_AUTHTOKEN_HERE

# Verify configuration
ngrok config check
```

**Windows:**
```bash
# Install ngrok
choco install ngrok
# OR download from https://ngrok.com/download

# Add your authtoken
ngrok config add-authtoken YOUR_AUTHTOKEN_HERE

# Verify configuration
ngrok config check
```

### Authtoken Example (DO NOT USE - Get your own)
```bash
# Example command (replace with YOUR token)
ngrok config add-authtoken 34YmXaktXF9m4lGgLMELViFAmBQ_2FgVEnWNaMkb4tZM8disg
```

### Using ngrok with the project

**Start with ngrok (for webhooks):**
```bash
npm run dev
```
This will show the public URL in the terminal:
```
Forwarding  https://xxxxx.ngrok-free.app -> http://localhost:3001
```

**Start without ngrok (local development):**
```bash
npm run dev:no-tunnel
```

### Desabilitar ngrok temporariamente
Use o comando `dev:no-tunnel` ao invés de `dev`:
```bash
npm run dev:no-tunnel
```

## 🐛 Troubleshooting

### Erro: Port 3000 ou 3001 já em uso
```bash
npm run kill:ports
```

### Erro: ngrok não encontrado
**Mac:**
```bash
brew install ngrok
```

**Windows:**
```bash
choco install ngrok
# ou baixe de https://ngrok.com/download
```

### Erro: PowerShell não reconhecido (Mac/Linux)
✅ Já resolvido! Os scripts agora são cross-platform.

## 📝 Diferenças Entre OS

### Windows
- PowerShell scripts removidos
- Use Git Bash ou CMD
- Ngrok via chocolatey ou download manual

### Mac/Linux
- Scripts shell nativos
- Ngrok via homebrew
- Permissões podem precisar de `sudo` em alguns casos

## ✨ Novos Scripts Adicionados

| Script | Descrição | Cross-Platform |
|--------|-----------|----------------|
| `dev:no-tunnel` | Dev sem ngrok | ✅ |
| `kill:ports` | Limpa portas 3000/3001 | ✅ |
| `clean` | Remove node_modules/dist | ✅ |

## 🎯 Workflow Recomendado

### Desenvolvimento Local (sem ngrok)
```bash
npm run dev:no-tunnel
```
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- WebSocket: ws://localhost:3001

### Desenvolvimento com Webhooks (com ngrok)
```bash
npm run dev
```
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- Ngrok: https://xxxx.ngrok.io → localhost:3001

---

**Última atualização:** 29 de outubro de 2025
