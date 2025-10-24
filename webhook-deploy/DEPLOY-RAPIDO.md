# 🚀 DEPLOY WEBHOOK PROXY

## 1. Criar ZIP
```powershell
cd C:\Users\rafae\Downloads\WhatsAI2
Compress-Archive -Path webhook-deploy\* -DestinationPath webhook-proxy.zip -Force
```

## 2. Upload no Easypanel
- Abrir app webhook no Easypanel
- Settings → Source → Upload ZIP
- Fazer upload de `webhook-proxy.zip`

## 3. Configurar Variável de Ambiente
No Easypanel, adicionar:
```
BACKEND_URL=https://seu-backend-principal.com
```
(Substituir pela URL do seu backend principal)

## 4. Deploy
Clicar em "Deploy"

---

Agora todos os webhooks serão encaminhados para o backend principal onde o código correto está rodando.
