# 🌐 Ngrok - Guia Rápido de Configuração

## ✅ Status Atual
- ✅ Ngrok instalado: `/opt/homebrew/bin/ngrok`
- ✅ Authtoken configurado: `34YmXaktXF9m4lGgLMELViFAmBQ_2FgVEnWNaMkb4tZM8disg`
- ✅ Configuração válida: `/Users/desenvolvimentomobile/Library/Application Support/ngrok/ngrok.yml`

## 🚀 Como Usar

### Desenvolvimento COM webhooks (ngrok ativo)
```bash
npm run dev
```
**Resultado:**
- Backend: http://localhost:3001 (local)
- Backend: https://xxxxx.ngrok-free.app (público)
- Frontend: http://localhost:3000 (local)

### Desenvolvimento SEM webhooks (local apenas)
```bash
npm run dev:no-tunnel
```
**Resultado:**
- Backend: http://localhost:3001 (local)
- Frontend: http://localhost:3000 (local)

## 📋 Comandos Úteis

### Ver configuração atual
```bash
ngrok config check
```

### Editar configuração
```bash
# Mac/Linux
nano ~/Library/Application\ Support/ngrok/ngrok.yml

# Windows
notepad %USERPROFILE%\AppData\Local\ngrok\ngrok.yml
```

### Testar ngrok manualmente
```bash
# Iniciar ngrok na porta 3001
ngrok http 3001

# Iniciar com domínio customizado (pago)
ngrok http 3001 --domain=seu-dominio.ngrok.app
```

## 🔧 Configuração para Evolution API

### 1. Obter URL pública do ngrok
Quando você roda `npm run dev`, veja no terminal:
```
[NGROK] Forwarding  https://ardath-quaky-epiphenomenally.ngrok-free.app -> http://localhost:3001
```

### 2. Configurar webhook na Evolution API
```bash
# Exemplo de configuração
POST https://hsapi.studio/webhook/set/{instanceName}
{
  "url": "https://ardath-quaky-epiphenomenally.ngrok-free.app/api/webhooks/evolution/{instanceName}",
  "webhook_by_events": false,
  "webhook_base64": true,
  "events": [
    "QRCODE_UPDATED",
    "CONNECTION_UPDATE",
    "MESSAGES_UPSERT",
    "MESSAGES_UPDATE",
    "CONTACTS_UPDATE",
    "CHATS_UPSERT",
    "PRESENCE_UPDATE"
  ]
}
```

### 3. Verificar se webhooks estão chegando
```bash
# No terminal do backend, você verá:
[BACK] 🪝 [WEBHOOK] Received event: MESSAGES_UPSERT
[BACK] ✅ [MESSAGES_UPSERT] Message saved: msg_123
```

## ⚠️ Importante

### URL muda a cada reinício
- ✅ URL gratuita muda toda vez que reinicia ngrok
- ❌ Precisa reconfigurar webhook na Evolution API
- 💰 Plano pago tem domínio fixo

### Alternativas ao ngrok
```bash
# Localtunnel (grátis, sem cadastro)
npx localtunnel --port 3001

# Cloudflare Tunnel (grátis, domínio fixo)
cloudflared tunnel --url http://localhost:3001
```

## 🐛 Troubleshooting

### Erro: "endpoint is already online" (ERR_NGROK_334)
Este erro acontece quando você já tem uma sessão ngrok ativa no mesmo endpoint.

**Solução 1: Parar todas as sessões ngrok**
```bash
# Matar processos locais
pkill -9 ngrok

# Verificar se há processos rodando
ps aux | grep ngrok
```

**Solução 2: Usar modo local (sem ngrok)**
```bash
# Desenvolvimento sem ngrok
npm run dev:no-tunnel
```

**Solução 3: Dashboard ngrok**
1. Acesse: https://dashboard.ngrok.com/endpoints/status
2. Pare todas as sessões ativas
3. Tente novamente: `npm run dev`

**Solução 4: Gerar novo endpoint**
O plano free do ngrok permite apenas 1 endpoint ativo. Se você iniciou ngrok em outro computador ou terminal, precisa parar aquela sessão primeiro.

### Erro: "authentication failed"
```bash
# Reconfigurar authtoken
ngrok config add-authtoken 34YmXaktXF9m4lGgLMELViFAmBQ_2FgVEnWNaMkb4tZM8disg
```

### Erro: "ngrok: command not found"
```bash
# Mac
brew install ngrok

# Windows
choco install ngrok
```

### Ngrok não inicia com npm run dev
```bash
# Use modo local
npm run dev:no-tunnel

# Ou inicie ngrok separadamente
npm run tunnel
```

## 📊 Planos ngrok

### Free (Atual)
- ✅ 1 agente online
- ✅ URLs randômicas
- ✅ 40 requisições/minuto
- ❌ Domínio fixo

### Personal ($8/mês)
- ✅ Domínio fixo
- ✅ 3 agentes online
- ✅ 120 req/min

### Pro ($20/mês)
- ✅ Domínios customizados
- ✅ IP whitelisting
- ✅ 600 req/min

## 🎯 Recomendação

**Desenvolvimento local:**
```bash
npm run dev:no-tunnel
```

**Testar webhooks:**
```bash
npm run dev
# Copie a URL do terminal
# Configure na Evolution API
```

**Produção:**
- Não use ngrok
- Use servidor com IP fixo
- Configure domínio próprio

---

**Última atualização:** 29/10/2025  
**Status:** ✅ Configurado e funcionando
