# ✅ WhatsAI2 - Configuração Cross-Platform Concluída

## 📋 Mudanças Implementadas (29/10/2025)

### 1. Package.json Raiz - Scripts Cross-Platform
**Antes (só Windows):**
```json
"predev": "powershell -Command \"try { Get-Process ngrok...",
"clean": "Remove-Item -Recurse -Force..."
```

**Depois (Windows + Mac + Linux):**
```json
"predev": "npm run kill:ports",
"clean": "rimraf server/node_modules server/dist...",
"kill:ports": "npx kill-port-process 3001 3000 || echo '✅ Ports cleaned'",
"dev:no-tunnel": "concurrently... (sem ngrok)"
```

### 2. Novos Scripts Adicionados

| Script | Descrição | Plataforma |
|--------|-----------|------------|
| `npm run dev` | Backend + Frontend + ngrok | ✅ Todas |
| `npm run dev:no-tunnel` | Backend + Frontend (sem ngrok) | ✅ Todas |
| `npm run kill:ports` | Limpa portas 3000/3001 | ✅ Todas |
| `npm run clean` | Remove node_modules/dist | ✅ Todas |
| `npm run install:all` | Instala tudo | ✅ Todas |

### 3. Scripts de Inicialização Rápida

#### Mac/Linux
```bash
chmod +x start-mac.sh
./start-mac.sh
```
**Features:**
- ✅ Verifica Node.js 18+
- ✅ Cria .env se não existir
- ✅ Instala dependências automaticamente
- ✅ Inicializa Prisma
- ✅ Limpa portas
- ✅ Menu interativo de escolha

#### Windows
```batch
start-windows.bat
```
**Features:**
- ✅ Verifica Node.js
- ✅ Cria .env se não existir
- ✅ Instala dependências automaticamente
- ✅ Limpa portas
- ✅ Menu interativo de escolha

### 4. Documentação Criada

- ✅ `CROSS-PLATFORM-SETUP.md` - Guia completo
- ✅ `README.md` atualizado - Instruções cross-platform
- ✅ Scripts comentados e documentados

## 🚀 Como Usar (Agora)

### Primeira Vez - Mac
```bash
# 1. Clone o projeto
git clone <repo-url>
cd WhatsAI2

# 2. Execute o script de setup
./start-mac.sh

# 3. Escolha o modo de desenvolvimento
# Opção 1: Full (com ngrok)
# Opção 2: Local (sem ngrok) ← Recomendado para desenvolvimento
```

### Primeira Vez - Windows
```batch
REM 1. Clone o projeto
git clone <repo-url>
cd WhatsAI2

REM 2. Execute o script de setup
start-windows.bat

REM 3. Escolha o modo de desenvolvimento
REM Opção 1: Full (com ngrok)
REM Opção 2: Local (sem ngrok) ← Recomendado para desenvolvimento
```

### Uso Diário
```bash
# Desenvolvimento local (SEM ngrok) - Recomendado
npm run dev:no-tunnel

# Desenvolvimento com webhooks (COM ngrok)
npm run dev

# Limpar portas antes de iniciar
npm run kill:ports

# Reinstalar tudo do zero
npm run clean
npm run install:all
```

## 🔧 Dependências Adicionadas

```json
{
  "devDependencies": {
    "rimraf": "^6.0.1"  // Cross-platform file deletion
  }
}
```

## ✅ Testes Realizados

### Mac (testado em 29/10/2025)
- ✅ `npm run kill:ports` - Funciona
- ✅ `npm install` - Funciona
- ✅ Scripts cross-platform - Funcionam
- ✅ ngrok detectado - `/opt/homebrew/bin/ngrok`

### Windows (pendente de teste)
- ⏳ Testar `npm run kill:ports`
- ⏳ Testar `start-windows.bat`
- ⏳ Verificar ngrok instalado

## 🎯 Próximos Passos

### Para Desenvolver no Mac
```bash
cd /Users/desenvolvimentomobile/rafa/WhatsAI2
npm run dev:no-tunnel
```
**URLs:**
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- WebSocket: ws://localhost:3001

### Para Desenvolver no Windows
```batch
cd C:\Users\...\WhatsAI2
npm run dev:no-tunnel
```
**URLs:**
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- WebSocket: ws://localhost:3001

### Quando Precisar de Ngrok (Webhooks Evolution API)
```bash
# Instalar ngrok primeiro
# Mac: brew install ngrok
# Windows: choco install ngrok

# Configurar token
ngrok config add-authtoken YOUR_TOKEN_HERE

# Usar com ngrok
npm run dev
```

## 📝 Arquivos Modificados

1. ✅ `/package.json` - Scripts cross-platform
2. ✅ `/README.md` - Documentação atualizada
3. ✅ `/start-mac.sh` - Script Mac/Linux
4. ✅ `/start-windows.bat` - Script Windows
5. ✅ `/CROSS-PLATFORM-SETUP.md` - Guia completo
6. ✅ `/CROSS-PLATFORM-CHANGES.md` - Este arquivo

## 🐛 Troubleshooting

### Erro: "Port 3000 already in use"
```bash
npm run kill:ports
```

### Erro: "ngrok: command not found"
```bash
# Mac
brew install ngrok

# Windows
choco install ngrok
# OU baixe de https://ngrok.com/download
```

### Erro: "Permission denied: ./start-mac.sh"
```bash
chmod +x start-mac.sh
```

### Erro: ".env not found"
```bash
cd server
cp .env.example .env
# Edite o arquivo com suas credenciais
```

## 🎉 Conclusão

**Status:** ✅ Projeto 100% cross-platform configurado

**Compatibilidade:**
- ✅ Windows (PowerShell removido)
- ✅ Mac (testado)
- ✅ Linux (compatível)

**Próximo teste:** Rodar `npm run dev:no-tunnel` e verificar se backend + frontend iniciam corretamente.

---

**Data:** 29 de outubro de 2025  
**Responsável:** Rafael Halder  
**Objetivo:** Projeto WhatsAI2 funcional em Windows e Mac
