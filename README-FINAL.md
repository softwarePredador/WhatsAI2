# WhatsAI Multi-Instance Manager 🚀

Sistema completo para gerenciamento de múltiplas instâncias do WhatsApp via Evolution API com interface web moderna.

## ✨ Funcionalidades Principais

### 🔐 Sistema de Autenticação
- Login seguro com JWT
- Controle de acesso por usuário
- Redirecionamento automático quando não autenticado

### 📱 Gerenciamento de Instâncias
- Criação e conexão de instâncias WhatsApp
- QR Code dinâmico para conexão
- Status em tempo real (conectado, desconectado, conectando)
- Refresh automático de status

### 💬 Sistema de Chat Completo
- Interface de chat similar ao WhatsApp
- Lista de conversas em tempo real
- Histórico completo de mensagens
- Envio de mensagens com verificação automática de WhatsApp
- **Validação inteligente**: Impede envio para números sem WhatsApp

### 🎨 Interface Moderna
- Design responsivo com Tailwind CSS e DaisyUI
- Tema claro/escuro
- Componentes reutilizáveis
- Navegação intuitiva

## 🛠️ Stack Tecnológica

### Backend
- **Node.js** + **TypeScript**
- **Express.js** para API REST
- **Prisma ORM** com SQLite
- **Socket.io** para atualizações em tempo real
- **Zod** para validação de dados
- **JWT** para autenticação

### Frontend
- **React** + **TypeScript**
- **Vite** para build e desenvolvimento
- **Tailwind CSS** + **DaisyUI** para UI
- **React Router** para navegação
- **Socket.io-client** para tempo real

### Integração
- **Evolution API v2** para WhatsApp
- Webhooks para recebimento de mensagens
- Verificação automática de números WhatsApp

## 🚀 Como Usar

### 1. Faça Login
- Acesse `http://localhost:3000/login`
- Use as credenciais: `admin@whatsai.com` / `admin123`

### 2. Crie uma Instância
- Vá para "Instâncias"
- Clique em "Nova Instância"
- Digite um nome e clique em "Criar"

### 3. Conecte ao WhatsApp
- Clique em "Conectar" na instância criada
- Escaneie o QR Code com seu WhatsApp
- Aguarde a conexão ser estabelecida

### 4. Envie Mensagens
**Opção 1: Modal de Envio**
- Clique em "Enviar Mensagem" na instância conectada
- Digite o número (ex: `5521999887766`)
- Digite a mensagem
- Clique em "Enviar"

**Opção 2: Interface de Chat**
- Clique em "Chat" na instância conectada
- Visualize suas conversas existentes
- Digite mensagens na interface do chat

### 5. Recursos Avançados
- **Verificação Automática**: O sistema verifica se o número tem WhatsApp antes de enviar
- **Histórico Completo**: Todas as mensagens são salvas e sincronizadas
- **Tempo Real**: Receba atualizações instantâneas de status e mensagens

## 🔧 Configuração de Desenvolvimento

### Pré-requisitos
- Node.js 18+
- npm ou yarn

### Instalação
```bash
# Clone o repositório
git clone <repo-url>
cd WhatsAI2

# Instale dependências
npm install

# Configure as variáveis de ambiente
cp server/.env.example server/.env

# Configure o banco de dados
cd server
npx prisma generate
npx prisma db push

# Inicie em modo desenvolvimento
npm run dev
```

### Estrutura do Projeto
```
WhatsAI2/
├── client/          # Frontend React + Vite
│   ├── src/
│   │   ├── components/     # Componentes reutilizáveis
│   │   ├── features/       # Features específicas
│   │   ├── pages/         # Páginas da aplicação
│   │   └── types/         # Tipos TypeScript
│   └── ...
├── server/          # Backend Node.js + Express
│   ├── src/
│   │   ├── api/           # Controllers e rotas
│   │   ├── database/      # Prisma e repositórios
│   │   ├── services/      # Lógica de negócio
│   │   └── types/         # Tipos TypeScript
│   ├── prisma/            # Esquema do banco
│   └── ...
└── ...
```

## 🎯 Casos de Uso

### Para Empresas
- Gerenciar múltiplas linhas de atendimento
- Automatizar respostas
- Centralizar conversas em uma interface

### Para Desenvolvedores
- Base sólida para chatbots
- API completa para integração
- Código bem estruturado e documentado

### Para Agências
- Gerenciar clientes com instâncias separadas
- Interface profissional
- Escalabilidade para múltiplos usuários

## 🔒 Segurança

- Autenticação JWT segura
- Validação de dados com Zod
- Proteção contra envio para números inválidos
- Logs detalhados para auditoria

## 📊 Monitoramento

- Status em tempo real das instâncias
- Logs detalhados de operações
- Métricas de uso e performance
- Alertas de erro e desconexão

## 🚦 Status do Projeto

✅ **MVP Completo e Funcional**
- Sistema de autenticação ✅
- Gerenciamento de instâncias ✅
- Interface de chat ✅
- Verificação de WhatsApp ✅
- Documentação completa ✅

## 🤝 Contribuição

Este projeto está pronto para produção e pode ser estendido com:
- Suporte a múltiplos usuários
- Dashboard de analytics
- Integração com CRM
- Chatbots automáticos
- Agendamento de mensagens

## 📄 Licença

MIT License - veja o arquivo LICENSE para detalhes.

---

**Desenvolvido com ❤️ para revolucionar a comunicação via WhatsApp**