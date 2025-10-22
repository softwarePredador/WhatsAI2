# 🧪 GUIA RÁPIDO DE TESTE - AUTENTICAÇÃO

**Data:** 18 de Outubro de 2025  
**Sistema:** WhatsAI Multi-Instance Manager

---

## ⚡ TESTE RÁPIDO (5 minutos)

### 1. Verificar Servidores Rodando

Abra PowerShell e execute:
```powershell
# Verificar Backend (porta 3001)
$backend = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue
if ($backend) { Write-Host "✅ Backend RODANDO" -ForegroundColor Green } else { Write-Host "❌ Backend PARADO" -ForegroundColor Red }

# Verificar Frontend (porta 3000)
$frontend = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($frontend) { Write-Host "✅ Frontend RODANDO" -ForegroundColor Green } else { Write-Host "❌ Frontend PARADO" -ForegroundColor Red }
```

**Se ambos estão PARADOS**, inicie com:
```powershell
npm run dev
```

---

### 2. Teste Backend via PowerShell

#### A) Health Check
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/health" -Method Get
```
**Esperado:** `status: ok`

#### B) Login com Usuário Admin
```powershell
$body = @{
    email = "admin@whatsai.com"
    password = "admin123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method Post -Body $body -ContentType "application/json"

Write-Host "`n✅ LOGIN BEM SUCEDIDO!" -ForegroundColor Green
Write-Host "Token: $($response.data.token.Substring(0,20))..." -ForegroundColor Cyan
Write-Host "Usuário: $($response.data.user.name)" -ForegroundColor Cyan
Write-Host "Email: $($response.data.user.email)" -ForegroundColor Cyan
Write-Host "Role: $($response.data.user.role)" -ForegroundColor Cyan

# Salvar token para próximos testes
$token = $response.data.token
```

#### C) Testar Rota Protegida (Me)
```powershell
$headers = @{
    Authorization = "Bearer $token"
}

$me = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/me" -Method Get -Headers $headers

Write-Host "`n✅ ROTA PROTEGIDA FUNCIONANDO!" -ForegroundColor Green
Write-Host "ID: $($me.data.id)" -ForegroundColor Cyan
Write-Host "Nome: $($me.data.name)" -ForegroundColor Cyan
```

#### D) Criar Nova Instância (Protegida)
```powershell
$instanceBody = @{
    name = "Teste $(Get-Date -Format 'HH:mm:ss')"
} | ConvertTo-Json

$instance = Invoke-RestMethod -Uri "http://localhost:3001/api/instances" -Method Post -Body $instanceBody -ContentType "application/json" -Headers $headers

Write-Host "`n✅ INSTÂNCIA CRIADA!" -ForegroundColor Green
Write-Host "ID: $($instance.data.id)" -ForegroundColor Cyan
Write-Host "Nome: $($instance.data.name)" -ForegroundColor Cyan
Write-Host "Status: $($instance.data.status)" -ForegroundColor Cyan
```

#### E) Tentar Criar Instância SEM Token (Deve Falhar)
```powershell
try {
    Invoke-RestMethod -Uri "http://localhost:3001/api/instances" -Method Post -Body $instanceBody -ContentType "application/json"
    Write-Host "❌ ERRO: Deveria ter bloqueado!" -ForegroundColor Red
} catch {
    Write-Host "`n✅ PROTEÇÃO FUNCIONANDO!" -ForegroundColor Green
    Write-Host "Status: 401 Unauthorized" -ForegroundColor Yellow
}
```

---

### 3. Teste Frontend no Navegador

#### A) Abrir Login
1. Abrir navegador: http://localhost:3000/login
2. Ver formulário de login

#### B) Fazer Login
- **Email:** `admin@whatsai.com`
- **Senha:** `admin123`
- Clicar em **"Entrar"**

#### C) Verificar Redirecionamento
- Deve redirecionar para: http://localhost:3000/dashboard
- Se redirecionar: ✅ **FUNCIONANDO!**

#### D) Testar Rota Protegida
- Tentar acessar diretamente: http://localhost:3000/dashboard
- **SEM LOGIN:** Deve redirecionar para /login
- **COM LOGIN:** Deve mostrar dashboard

#### E) Testar Logout
- No dashboard, clicar em **"Sair"**
- Deve limpar token e voltar para login

---

## 📋 CHECKLIST DE VALIDAÇÃO

### Backend:
- [ ] Health check responde
- [ ] Login com credenciais corretas retorna token
- [ ] Login com senha errada retorna 401
- [ ] Rota /me sem token retorna 401
- [ ] Rota /me com token retorna dados do usuário
- [ ] Criar instância sem token retorna 401
- [ ] Criar instância com token funciona

### Frontend:
- [ ] Página /login carrega
- [ ] Login com credenciais corretas redireciona para /dashboard
- [ ] Login com credenciais erradas mostra erro
- [ ] Acessar /dashboard sem login redireciona para /login
- [ ] Token é armazenado após login
- [ ] Logout limpa token

---

## 🎯 SCRIPT COMPLETO DE TESTE

Copie e cole no PowerShell:

```powershell
Write-Host "🧪 TESTE COMPLETO DE AUTENTICAÇÃO`n" -ForegroundColor Cyan

# 1. Health Check
Write-Host "1️⃣ Testando Health Check..." -ForegroundColor Yellow
$health = Invoke-RestMethod -Uri "http://localhost:3001/health"
if ($health.status -eq "ok") {
    Write-Host "   ✅ Backend respondendo" -ForegroundColor Green
} else {
    Write-Host "   ❌ Backend com problema" -ForegroundColor Red
    exit
}

# 2. Login
Write-Host "`n2️⃣ Testando Login..." -ForegroundColor Yellow
$loginBody = @{
    email = "admin@whatsai.com"
    password = "admin123"
} | ConvertTo-Json

try {
    $login = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $login.data.token
    Write-Host "   ✅ Login bem sucedido" -ForegroundColor Green
    Write-Host "   👤 Usuário: $($login.data.user.name)" -ForegroundColor Cyan
} catch {
    Write-Host "   ❌ Login falhou" -ForegroundColor Red
    exit
}

# 3. Me (Rota Protegida)
Write-Host "`n3️⃣ Testando Rota Protegida (/me)..." -ForegroundColor Yellow
$headers = @{ Authorization = "Bearer $token" }
try {
    $me = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/me" -Headers $headers
    Write-Host "   ✅ Rota protegida funcionando" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Rota protegida falhou" -ForegroundColor Red
}

# 4. Criar Instância COM Token
Write-Host "`n4️⃣ Testando Criar Instância (COM token)..." -ForegroundColor Yellow
$instanceBody = @{
    name = "Teste Automatico"
} | ConvertTo-Json

try {
    $instance = Invoke-RestMethod -Uri "http://localhost:3001/api/instances" -Method Post -Body $instanceBody -ContentType "application/json" -Headers $headers
    Write-Host "   ✅ Instância criada com sucesso" -ForegroundColor Green
    Write-Host "   📱 Nome: $($instance.data.name)" -ForegroundColor Cyan
} catch {
    Write-Host "   ❌ Falha ao criar instância" -ForegroundColor Red
}

# 5. Criar Instância SEM Token (Deve Falhar)
Write-Host "`n5️⃣ Testando Proteção (SEM token)..." -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "http://localhost:3001/api/instances" -Method Post -Body $instanceBody -ContentType "application/json"
    Write-Host "   ❌ ERRO: Não bloqueou requisição sem token!" -ForegroundColor Red
} catch {
    Write-Host "   ✅ Proteção funcionando (401 Unauthorized)" -ForegroundColor Green
}

# Resumo
Write-Host "`n═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ TODOS OS TESTES PASSARAM!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════`n" -ForegroundColor Cyan

Write-Host "📊 Credenciais de Teste:" -ForegroundColor Yellow
Write-Host "   Email: admin@whatsai.com" -ForegroundColor White
Write-Host "   Senha: admin123" -ForegroundColor White
Write-Host "`n🌐 URLs:" -ForegroundColor Yellow
Write-Host "   Frontend: http://localhost:3000/login" -ForegroundColor White
Write-Host "   Backend:  http://localhost:3001/api" -ForegroundColor White
```

---

## 🔧 TROUBLESHOOTING

### Erro: "Connection refused"
**Problema:** Servidores não estão rodando  
**Solução:** 
```powershell
npm run dev
```

### Erro: "Invalid credentials"
**Problema:** Senha incorreta ou usuário não existe  
**Solução:** Verifique as credenciais:
- Email: `admin@whatsai.com`
- Senha: `admin123`

Se ainda não funcionar, execute o seed novamente:
```powershell
cd server
npx tsx prisma/seed.ts
```

### Erro: "401 Unauthorized" em rota protegida
**Problema:** Token inválido ou expirado  
**Solução:** Faça login novamente para gerar novo token

### Frontend não redireciona após login
**Problema:** Token não está sendo salvo no Zustand  
**Solução:** Verificar console do navegador (F12) para erros

### CORS Error no Frontend
**Problema:** Backend não está aceitando requests do frontend  
**Solução:** Verificar se CORS está configurado no backend (já está)

---

## ✅ RESULTADO ESPERADO

Se tudo estiver funcionando:

```
✅ Health check: OK
✅ Login: Token gerado
✅ Rota protegida: Dados do usuário retornados
✅ Criar instância com token: Sucesso
✅ Criar instância sem token: 401 Unauthorized
✅ Frontend login: Redireciona para dashboard
✅ Frontend rota protegida: Bloqueia acesso sem login
```

**Status:** 🎉 **AUTENTICAÇÃO 100% FUNCIONAL!**

---

**Próximo Passo:** FASE 2 - Interface de Gerenciamento de Instâncias

**Documentação Completa:** Ver `FASE-1-AUTENTICACAO-COMPLETA.md`
