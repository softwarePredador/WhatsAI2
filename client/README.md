# WhatsAI - Frontend

Interface web para gerenciamento de instâncias WhatsApp.

## 🚀 Desenvolvimento

```bash
# Instalar dependências
npm install

# Rodar em modo desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview da build
npm run preview
```

## 🔧 Configuração

Crie um arquivo `.env` na raiz do diretório `client`:

```env
VITE_API_URL=http://localhost:5173/api
```

## 📱 Funcionalidades

- ✅ Login/Registro
- ✅ Dashboard de instâncias
- ✅ Visualização de QR Code
- ✅ Envio de mensagens
- ✅ Gerenciamento de conexões
- ✅ Real-time updates (WebSocket)

## 🎨 Tecnologias

- React 19
- TypeScript
- Vite
- TailwindCSS
- DaisyUI
- React Router DOM
- Axios
- Zustand
- React Hook Form
- Zod

## 📂 Estrutura

```
src/
├── features/
│   └── auth/
│       ├── components/
│       ├── services/
│       ├── store/
│       └── types/
├── pages/
├── components/
└── App.tsx
```
