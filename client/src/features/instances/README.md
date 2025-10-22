# Instances Feature

Feature completa para gerenciamento de instâncias WhatsApp.

## 📁 Estrutura

```
features/instances/
├── components/          # Componentes UI
│   ├── InstanceCard.tsx        # Card de instância individual
│   ├── CreateInstanceModal.tsx # Modal para criar nova instância
│   └── QRCodeModal.tsx         # Modal para exibir QR Code
├── pages/              # Páginas
│   └── InstancesPage.tsx       # Página principal de instâncias
├── services/           # Integração com API
│   └── instanceService.ts      # Chamadas HTTP para backend
├── store/              # Estado global (Zustand)
│   └── instanceStore.ts        # Store de instâncias
├── types/              # TypeScript types
│   └── instanceTypes.ts        # Interfaces e tipos
└── index.ts            # Barrel export
```

## 🚀 Funcionalidades

### InstancesPage
Página principal que exibe:
- **Header**: Título e botão "Nova Instância"
- **Stats**: Estatísticas de instâncias (total, conectadas, conectando, desconectadas)
- **Grid de Instâncias**: Cards com todas as instâncias
- **Empty State**: Mensagem quando não há instâncias
- **Modals**: Criar instância e visualizar QR Code

### InstanceCard
Card individual de instância com:
- **Nome e ID**: Informações da instância
- **Status Badge**: Badge colorido mostrando status atual
- **Connection Info**: Data de conexão e última atividade
- **Ações**:
  - **Conectar**: Gera QR Code para conectar ao WhatsApp
  - **Desconectar**: Desconecta a instância
  - **Ver QR Code**: Exibe o QR Code em modal
  - **Deletar**: Remove a instância (com confirmação)

### CreateInstanceModal
Modal para criar nova instância:
- **Campo Nome**: Nome identificador da instância (obrigatório, mínimo 3 caracteres)
- **Campo Webhook**: URL para receber eventos (opcional, validação de URL)
- **Validação**: Zod + React Hook Form
- **Loading States**: Feedback visual durante criação

### QRCodeModal
Modal para conexão WhatsApp:
- **Exibição do QR Code**: Imagem do QR Code gerado
- **Instruções**: Passo a passo de como conectar
- **Auto-refresh**: Atualização automática a cada 30 segundos (pode desabilitar)
- **Refresh Manual**: Botão para atualizar QR Code
- **Status**: Feedback quando conectado ou erro

## 📊 Status da Instância

```typescript
type InstanceStatus = 
  | "PENDING"       // Instância criada, não conectada ainda
  | "DISCONNECTED"  // Desconectada
  | "CONNECTING"    // Gerando QR Code, aguardando scan
  | "CONNECTED"     // Conectada e online
  | "ERROR";        // Erro de conexão
```

## 🔐 Autenticação

Todas as requisições utilizam o token JWT do `userAuthStore`:
- Header: `Authorization: Bearer <token>`
- Validado pelo `auth-middleware.ts` no backend

## 🎨 UI/UX

### Design System
- **DaisyUI**: Componentes base
- **TailwindCSS**: Estilização customizada
- **Gradientes**: Visual moderno e profissional
- **Responsivo**: Mobile-first design
- **Loading States**: Spinners e disabled states
- **Toasts**: Feedback com react-hot-toast

### Cores por Status
- **PENDING**: Cinza (badge-ghost)
- **DISCONNECTED**: Vermelho (badge-error)
- **CONNECTING**: Amarelo (badge-warning)
- **CONNECTED**: Verde (badge-success)
- **ERROR**: Vermelho (badge-error)

## 🔄 Fluxo de Uso

1. **Criar Instância**:
   - Usuário clica em "Nova Instância"
   - Preenche nome (e opcionalmente webhook)
   - Submete o formulário
   - Instância criada com status PENDING

2. **Conectar ao WhatsApp**:
   - Clica em "Conectar" no card da instância
   - QR Code é gerado
   - Modal exibe QR Code com instruções
   - Usuário scannea com WhatsApp
   - Status muda para CONNECTED

3. **Gerenciar Instância**:
   - Ver QR Code (se status = CONNECTING)
   - Desconectar (se conectada)
   - Deletar instância

## 🛠️ Tecnologias

- **React 19**: Framework UI
- **TypeScript**: Tipagem estática
- **Zustand**: State management
- **React Hook Form**: Gerenciamento de formulários
- **Zod**: Validação de schemas
- **Axios**: HTTP client
- **React Hot Toast**: Notificações

## 📡 Endpoints Utilizados

```typescript
GET    /api/instances           // Listar instâncias
GET    /api/instances/:id       // Buscar instância específica
POST   /api/instances           // Criar nova instância
POST   /api/instances/:id/connect     // Conectar instância
POST   /api/instances/:id/disconnect  // Desconectar instância
DELETE /api/instances/:id       // Deletar instância
```

## 🧪 Testing

Para testar a feature:

1. **Login**: Faça login com admin@whatsai.com / admin123
2. **Dashboard**: Clique em "Criar Instância WhatsApp"
3. **Nova Instância**: Preencha o formulário e crie
4. **Conectar**: Clique em "Conectar" no card
5. **QR Code**: Scaneie com WhatsApp
6. **Gerenciar**: Teste desconectar e deletar

## 🔮 Próximos Passos (FASE 3)

- [ ] WebSocket integration para status em tempo real
- [ ] Listagem de mensagens por instância
- [ ] Envio de mensagens
- [ ] Histórico de eventos webhook
- [ ] Filtros e busca de instâncias
- [ ] Bulk actions (conectar/desconectar múltiplas)
