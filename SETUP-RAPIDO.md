## 🚀 SETUP RÁPIDO - WhatsAI em Outro PC

### **1. Clone + Instalar**
```bash
git clone https://github.com/rafaelhalder/WhatsAI2.git
cd WhatsAI2
npm install
cd server && npm install
cd ../client && npm install
cd ..
```

### **2. Criar `server/.env`**
```env
NODE_ENV=development
PORT=3001
EVOLUTION_API_URL=https://hsapi.studio/
EVOLUTION_API_KEY=Pz6qEerZE5IYwaoc8ZCQxmBdLAinX4dl
JWT_SECRET=whatsai-super-secret-jwt-key-2024
DATABASE_URL="postgresql://postgres.viqjmhlxsqqoqimglxar:xitao3275rafa@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.viqjmhlxsqqoqimglxar:xitao3275rafa@aws-1-us-east-1.pooler.supabase.com:5432/postgres"
```

### **3. Criar `client/.env`**
```env
VITE_API_URL=/api
```

### **4. Setup Banco SQLite**
```bash
cd server
npx prisma generate
npx prisma db push
```

### **5. Iniciar Projeto**
```bash
cd ..
npm run dev
```

✅ Frontend: http://localhost:3000
✅ Backend: http://localhost:3001

---

## 📋 STATUS DO PROJETO

### ✅ **COMPLETO:**
- LocalStorage persistence
- Dark Mode (Light/Dark/Auto)
- Auto-Refresh configurável
- Notificações Push (browser)
- Notificações condicionais (toast)
- Loading states
- Unsaved changes indicator
- Modais de confirmação (Restaurar/Excluir)
- DaisyUI components completos

### ⏳ **PRÓXIMA FASE:**
**FASE 5: Backend API - Persistência de Settings**

1. Adicionar modelo `UserSettings` no Prisma
2. Criar endpoints GET/PUT `/api/user/settings`
3. Integrar frontend com backend
4. Endpoint DELETE `/api/user/account`

**Tempo:** 2-3 horas
