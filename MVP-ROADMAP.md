# 🚀 WhatsAI - Roadmap para MVP Comercializável

**Objetivo:** Transformar o WhatsAI em um produto vendável em 5-6 semanas

**Data de Início:** 29 de Outubro de 2025  
**Meta de Lançamento:** 10 de Dezembro de 2025

---

## 📊 Status Atual do Projeto

### ✅ Funcionalidades Prontas
- [x] Autenticação JWT completa (login, registro, perfil)
- [x] Multi-instância WhatsApp (criar, conectar, desconectar)
- [x] Interface de Chat completa (WhatsApp-like)
- [x] WebSocket para atualizações em tempo real
- [x] Cache otimizado (99.7% hit rate, 2200x mais rápido)
- [x] Performance otimizada (49% mais rápido - 4961ms → 2545ms)
- [x] Envio de mídia básico (imagens, documentos, áudio)
- [x] Verificação de número WhatsApp
- [x] Dashboard com estrutura básica
- [x] Debounce/Throttle em webhooks (95% redução DB writes)

### ✅ FASE 3 - MVP Funcional (COMPLETA!)
- [x] Storage de mídia completo (DigitalOcean Spaces/S3)
- [x] Dashboard com dados reais (métricas, gráficos, custos)
- [x] Sistema de templates (CRUD, variáveis, categorias)
- [x] Envio em massa (campanhas, rate limiting, fila)
- [x] Sistema de limites e quotas por plano

### ⚠️ Gaps Críticos Pendentes (FASE 4)
- [ ] Sistema de planos/billing (Stripe integration)
- [ ] Multi-tenancy completo (organizações)
- [ ] Automação/chatbot básico
- [ ] Onboarding de usuários

---

## 🎯 FASE 3 - MVP Funcional (Semanas 1-2)

**Objetivo:** Completar funcionalidades core e corrigir gaps técnicos  
**Duração:** 10-12 dias úteis  
**Entregável:** Produto estável para testes beta

### **Sprint 1: Storage & Dashboard Real (Dias 1-5)**

#### 📦 Task 3.1: Completar Storage de Mídia (3 dias)
**Prioridade:** 🔴 CRÍTICA  
**Arquivos:** `server/src/services/media-storage-service.ts`

**Subtasks:**
- [ ] Implementar upload completo para DigitalOcean Spaces
  - [ ] Método `saveToS3()` com retry logic
  - [ ] Configuração de ACL e permissões públicas
  - [ ] Upload otimizado com streams
- [ ] Implementar remoção de arquivos S3
  - [ ] Método `deleteFromS3()`
  - [ ] Limpeza de arquivos órfãos
- [ ] Implementar verificação de existência
  - [ ] Método `fileExistsInS3()`
- [ ] Implementar download de arquivos
  - [ ] Método `getFileFromS3()`
  - [ ] Signed URLs com expiração
- [ ] Migração de arquivos locais para S3 (script)
- [ ] Testes de integração S3

**Critérios de Aceitação:**
- ✅ Todas as mídias são salvas no Spaces automaticamente
- ✅ URLs públicas funcionam corretamente
- ✅ Remoção de arquivos funciona
- ✅ Migração de arquivos existentes completa
- ✅ Testes passando com 100% cobertura

**Estimativa:** 24 horas de desenvolvimento

---

#### 📊 Task 3.2: Dashboard com Dados Reais (2 dias)
**Prioridade:** 🟡 ALTA  
**Arquivos:** `server/src/api/routes/dashboard.ts`, `server/src/services/dashboard-service.ts`

**Subtasks:**
- [ ] Criar `DashboardService` com queries otimizadas
- [ ] Implementar métricas reais:
  - [ ] Total de mensagens (count real do banco)
  - [ ] Instâncias ativas (status = CONNECTED)
  - [ ] Taxa de entrega real (DELIVERED / SENT)
  - [ ] Armazenamento usado (soma de tamanhos de mídia)
- [ ] Implementar cálculo de custos:
  - [ ] Custos Evolution API (por instância ativa)
  - [ ] Custos de storage (GB * preço)
  - [ ] Custos totais mensais
- [ ] Implementar gráficos com dados reais:
  - [ ] Messages Over Time (últimos 30 dias)
  - [ ] Instance Status Distribution
  - [ ] User Activity (usuários ativos por dia)
- [ ] Cache de métricas (TTL 5 minutos)
- [ ] Testes unitários das queries

**Critérios de Aceitação:**
- ✅ Todos os números do dashboard refletem dados reais
- ✅ Gráficos carregam em <500ms (com cache)
- ✅ Custos calculados corretamente
- ✅ Métricas atualizam em tempo real via WebSocket
- ✅ Testes com cobertura >80%

**Estimativa:** 16 horas de desenvolvimento

---

### **Sprint 2: Templates & Bulk Messages (Dias 6-10)**

#### 📝 Task 3.3: Sistema de Templates (3 dias)
**Prioridade:** 🟡 ALTA  
**Valor de Negócio:** Alto (feature muito solicitada)

**Database Schema:**
```prisma
model MessageTemplate {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  name        String   // "Boas-vindas", "Follow-up", etc
  content     String   @db.Text
  category    String?  // "marketing", "support", "sales"
  variables   Json     // ["nome", "empresa", "produto"]
  isActive    Boolean  @default(true)
  usageCount  Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([userId, isActive])
  @@map("message_templates")
}
```

**Subtasks:**
- [ ] Backend:
  - [ ] Criar migration do Prisma
  - [ ] Criar `TemplateService` com CRUD
  - [ ] Endpoint POST `/api/templates` (criar)
  - [ ] Endpoint GET `/api/templates` (listar)
  - [ ] Endpoint PUT `/api/templates/:id` (editar)
  - [ ] Endpoint DELETE `/api/templates/:id` (deletar)
  - [ ] Substituição de variáveis `{{nome}}` → valor real
  - [ ] Validação de templates (Zod)
- [ ] Frontend:
  - [ ] Página `TemplatesPage.tsx`
  - [ ] Modal `CreateTemplateModal.tsx`
  - [ ] Lista de templates com preview
  - [ ] Editor de template com variáveis
  - [ ] Botão "Usar Template" no chat
  - [ ] Store Zustand para templates
- [ ] Testes:
  - [ ] Testes unitários de substituição de variáveis
  - [ ] Testes E2E de uso de template no chat

**Critérios de Aceitação:**
- ✅ Usuário pode criar/editar/deletar templates
- ✅ Templates aparecem no chat para uso rápido
- ✅ Variáveis {{nome}}, {{data}} são substituídas corretamente
- ✅ Templates são filtráveis por categoria
- ✅ Contador de uso funciona

**Estimativa:** 24 horas de desenvolvimento

---

#### 📢 Task 3.4: Envio em Massa Básico (5 dias)
**Prioridade:** 🔴 CRÍTICA  
**Valor de Negócio:** Muito Alto (principal feature B2B)

**Database Schema:**
```prisma
model BroadcastCampaign {
  id            String    @id @default(uuid())
  userId        String
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  instanceId    String
  instance      Instance  @relation(fields: [instanceId], references: [id], onDelete: Cascade)
  name          String
  message       String    @db.Text
  templateId    String?
  template      MessageTemplate? @relation(fields: [templateId], references: [id])
  recipients    Json      // [{ phone: "5511999999999", name: "João", vars: {...} }]
  status        String    @default("DRAFT") // DRAFT, SCHEDULED, SENDING, COMPLETED, FAILED
  totalRecipients Int     @default(0)
  sentCount     Int       @default(0)
  failedCount   Int       @default(0)
  scheduledFor  DateTime?
  startedAt     DateTime?
  completedAt   DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  messages      BroadcastMessage[]
  
  @@index([userId, status])
  @@index([instanceId, status])
  @@map("broadcast_campaigns")
}

model BroadcastMessage {
  id          String    @id @default(uuid())
  campaignId  String
  campaign    BroadcastCampaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  recipient   String    // Número do WhatsApp
  recipientName String?
  message     String    @db.Text
  status      String    @default("PENDING") // PENDING, SENT, DELIVERED, READ, FAILED
  errorMessage String?
  sentAt      DateTime?
  deliveredAt DateTime?
  createdAt   DateTime  @default(now())
  
  @@index([campaignId, status])
  @@map("broadcast_messages")
}
```

**Subtasks:**
- [ ] Backend:
  - [ ] Criar migrations
  - [ ] `BroadcastService` com fila (Bull/BullMQ)
  - [ ] Job processor com rate limiting (10 msg/min)
  - [ ] Endpoint POST `/api/broadcasts` (criar campanha)
  - [ ] Endpoint GET `/api/broadcasts` (listar campanhas)
  - [ ] Endpoint POST `/api/broadcasts/:id/start` (iniciar envio)
  - [ ] Endpoint GET `/api/broadcasts/:id/stats` (estatísticas)
  - [ ] WebSocket para progresso em tempo real
  - [ ] Retry automático de falhas (3 tentativas)
  - [ ] Validação de números WhatsApp antes de enviar
- [ ] Frontend:
  - [ ] Página `BroadcastsPage.tsx`
  - [ ] Wizard de criação em 3 etapas:
    1. Upload CSV ou seleção manual
    2. Escolher template/mensagem
    3. Preview e confirmação
  - [ ] Barra de progresso em tempo real
  - [ ] Relatório de campanha (enviados, falhas, taxa)
  - [ ] Store Zustand para broadcasts
- [ ] Testes:
  - [ ] Testes de fila (job processing)
  - [ ] Testes de rate limiting
  - [ ] Testes E2E de campanha completa

**Critérios de Aceitação:**
- ✅ Usuário pode criar campanha com até 1000 destinatários
- ✅ Upload de CSV funciona (parse correto)
- ✅ Rate limiting impede bloqueio do WhatsApp
- ✅ Progresso atualiza em tempo real
- ✅ Relatório mostra estatísticas precisas
- ✅ Retry automático de falhas funciona

**Estimativa:** 40 horas de desenvolvimento

---

### **Sprint 3: Limites & Quotas (Dias 11-12)**

#### 🔒 Task 3.5: Sistema de Limites Básico (2 dias)
**Prioridade:** 🔴 CRÍTICA (necessário para monetização)

**Database Schema:**
```prisma
model User {
  // ... campos existentes
  plan          String   @default("FREE") // FREE, PRO, ENTERPRISE
  planLimits    Json     // { instances: 2, messages_per_day: 100, broadcasts: false }
  usageStats    Json     // { messages_today: 45, last_reset: "2025-10-29" }
}
```

**Planos Iniciais:**
```typescript
const PLANS = {
  FREE: {
    instances: 1,
    messages_per_day: 100,
    broadcasts: false,
    templates: 3,
    team_members: 1,
    price: 0
  },
  PRO: {
    instances: 5,
    messages_per_day: 5000,
    broadcasts: true,
    broadcasts_per_month: 10,
    templates: 50,
    team_members: 5,
    price: 97
  },
  ENTERPRISE: {
    instances: -1, // ilimitado
    messages_per_day: -1,
    broadcasts: true,
    broadcasts_per_month: -1,
    templates: -1,
    team_members: -1,
    price: 497
  }
}
```

**Subtasks:**
- [x] Backend:
  - [x] Middleware `checkLimits` para validar quotas
  - [x] Contador de mensagens diárias (reset automático)
  - [x] Bloqueio ao atingir limite
  - [x] Endpoint GET `/api/usage` (estatísticas de uso)
  - [x] Endpoint GET `/api/plans` (planos disponíveis)
  - [x] Jobs de reset diário de contadores
- [ ] Frontend:
  - [ ] Componente `UsageBar` (barra de progresso)
  - [ ] Modal de upgrade quando atinge limite
  - [ ] Página `PlansPage.tsx` com comparação
  - [ ] Badge do plano atual no perfil
- [x] Testes:
  - [x] Testes de middleware de limites
  - [x] Testes de reset de contadores

**Critérios de Aceitação:**
- ✅ Usuário FREE não pode criar 2ª instância
- ✅ Bloqueio ao atingir limite de mensagens diárias
- ✅ Mensagem clara de upgrade exibida
- ✅ Contadores resetam à meia-noite
- ✅ Página de planos mostra benefícios claros

**Estimativa:** 16 horas de desenvolvimento

---

## 📈 Resultado da FASE 3

Ao final desta fase, teremos:
- ✅ Storage de mídia 100% funcional e escalável
- ✅ Dashboard com métricas reais e precisas
- ✅ Sistema de templates para agilizar atendimento
- ✅ Envio em massa funcional com fila e rate limiting
- ✅ Sistema de limites para monetização

**Status:** MVP funcional pronto para testes beta com primeiros clientes

---

## 💰 FASE 4 - Monetização (Semanas 3-4)

**Objetivo:** Transformar em produto comercializável  
**Duração:** 10-12 dias úteis  
**Entregável:** Produto pronto para vender

### **Sprint 4: Billing & Payment (Dias 13-17)**

#### 💳 Task 4.1: Integração Stripe (5 dias)
**Prioridade:** 🔴 CRÍTICA  
**Valor de Negócio:** Muito Alto

**Database Schema:**
```prisma
model Subscription {
  id                String    @id @default(uuid())
  userId            String    @unique
  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  stripeCustomerId  String    @unique
  stripeSubscriptionId String? @unique
  plan              String    // FREE, PRO, ENTERPRISE
  status            String    // active, canceled, past_due, trialing
  currentPeriodStart DateTime
  currentPeriodEnd   DateTime
  cancelAtPeriodEnd  Boolean  @default(false)
  trialEnd          DateTime?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  invoices          Invoice[]
  
  @@map("subscriptions")
}

model Invoice {
  id              String   @id @default(uuid())
  subscriptionId  String
  subscription    Subscription @relation(fields: [subscriptionId], references: [id])
  stripeInvoiceId String   @unique
  amount          Int      // centavos
  status          String   // paid, open, void, uncollectible
  paidAt          DateTime?
  invoiceUrl      String?
  createdAt       DateTime @default(now())
  
  @@map("invoices")
}
```

**Subtasks:**
- [ ] Backend:
  - [ ] Instalar e configurar Stripe SDK
  - [ ] Criar produtos e preços no Stripe Dashboard
  - [ ] Endpoint POST `/api/billing/create-checkout` (sessão de pagamento)
  - [ ] Endpoint POST `/api/billing/webhook` (webhooks Stripe)
  - [ ] Endpoint POST `/api/billing/portal` (portal de gerenciamento)
  - [ ] Endpoint GET `/api/billing/subscription` (status assinatura)
  - [ ] Handler de eventos: `checkout.session.completed`
  - [ ] Handler de eventos: `customer.subscription.updated`
  - [ ] Handler de eventos: `customer.subscription.deleted`
  - [ ] Handler de eventos: `invoice.payment_succeeded`
  - [ ] Handler de eventos: `invoice.payment_failed`
  - [ ] Atualizar plano do usuário automaticamente
  - [ ] Email de confirmação de pagamento
  - [ ] Downgrade automático ao cancelar
- [ ] Frontend:
  - [ ] Página `PlansPage.tsx` com preços e CTAs
  - [ ] Botão "Upgrade" redireciona para Stripe Checkout
  - [ ] Página de sucesso pós-pagamento
  - [ ] Página de gerenciamento de assinatura
  - [ ] Modal de confirmação de cancelamento
- [ ] Testes:
  - [ ] Testes de webhooks com Stripe CLI
  - [ ] Testes de fluxo completo (upgrade → downgrade)

**Critérios de Aceitação:**
- ✅ Checkout do Stripe funciona perfeitamente
- ✅ Webhooks atualizam plano automaticamente
- ✅ Portal de gerenciamento permite cancelamento
- ✅ Downgrade preserva dados mas aplica limites
- ✅ Emails de confirmação são enviados
- ✅ Testes cobrem 100% dos webhooks

**Estimativa:** 40 horas de desenvolvimento

---

### **Sprint 5: Multi-tenancy & Automação (Dias 18-22)**

#### 🏢 Task 4.2: Sistema de Organizações (3 dias)
**Prioridade:** 🟡 ALTA  
**Valor de Negócio:** Alto (feature B2B)

**Database Schema:**
```prisma
model Organization {
  id          String   @id @default(uuid())
  name        String
  slug        String   @unique
  ownerId     String
  owner       User     @relation("OrganizationOwner", fields: [ownerId], references: [id])
  plan        String   @default("PRO")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  members     OrganizationMember[]
  instances   Instance[]
  
  @@map("organizations")
}

model OrganizationMember {
  id             String       @id @default(uuid())
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  userId         String
  user           User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  role           String       @default("MEMBER") // OWNER, ADMIN, MEMBER, VIEWER
  invitedBy      String?
  joinedAt       DateTime     @default(now())
  
  @@unique([organizationId, userId])
  @@map("organization_members")
}
```

**Subtasks:**
- [ ] Backend:
  - [ ] Migrations de organizações
  - [ ] `OrganizationService` com CRUD
  - [ ] Middleware de autorização por role
  - [ ] Endpoint POST `/api/organizations` (criar)
  - [ ] Endpoint GET `/api/organizations` (listar minhas)
  - [ ] Endpoint POST `/api/organizations/:id/invite` (convidar membro)
  - [ ] Endpoint DELETE `/api/organizations/:id/members/:userId` (remover)
  - [ ] Endpoint PUT `/api/organizations/:id/members/:userId/role` (mudar role)
  - [ ] Associar instâncias a organizações
  - [ ] Permissões: VIEWER só vê, MEMBER envia, ADMIN gerencia
- [ ] Frontend:
  - [ ] Seletor de organização no header
  - [ ] Página `OrganizationSettingsPage.tsx`
  - [ ] Lista de membros com roles
  - [ ] Modal de convite (email)
  - [ ] Gerenciamento de permissões
- [ ] Testes:
  - [ ] Testes de autorização por role
  - [ ] Testes de convite e aceitação

**Critérios de Aceitação:**
- ✅ Usuário pode criar organização
- ✅ Convites por email funcionam
- ✅ Roles limitam ações corretamente
- ✅ Instâncias são compartilhadas na organização
- ✅ Owner pode remover membros

**Estimativa:** 24 horas de desenvolvimento

---

#### 🤖 Task 4.3: Automação Básica (2 dias)
**Prioridade:** 🟢 MÉDIA  
**Valor de Negócio:** Diferencial competitivo

**Database Schema:**
```prisma
model AutoReply {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  instanceId  String
  instance    Instance @relation(fields: [instanceId], references: [id], onDelete: Cascade)
  name        String
  trigger     String   // "keyword", "first_message", "outside_hours"
  keywords    Json?    // ["olá", "oi", "menu"]
  response    String   @db.Text
  isActive    Boolean  @default(true)
  priority    Int      @default(0)
  workingHours Json?   // { start: "09:00", end: "18:00", days: [1,2,3,4,5] }
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([instanceId, isActive])
  @@map("auto_replies")
}
```

**Subtasks:**
- [ ] Backend:
  - [ ] `AutoReplyService` com lógica de matching
  - [ ] Processamento de keywords (case-insensitive)
  - [ ] Verificação de horário de trabalho
  - [ ] Integração no webhook de mensagens recebidas
  - [ ] Endpoint POST `/api/auto-replies` (criar)
  - [ ] Endpoint GET `/api/auto-replies` (listar)
  - [ ] Endpoint PUT `/api/auto-replies/:id/toggle` (ativar/desativar)
  - [ ] Logs de respostas automáticas enviadas
- [ ] Frontend:
  - [ ] Página `AutoRepliesPage.tsx`
  - [ ] Modal de criação com wizard
  - [ ] Toggle para ativar/desativar
  - [ ] Estatísticas de uso
- [ ] Testes:
  - [ ] Testes de matching de keywords
  - [ ] Testes de horário de trabalho

**Critérios de Aceitação:**
- ✅ Respostas automáticas funcionam por keyword
- ✅ Horário de trabalho é respeitado
- ✅ Mensagem de ausência enviada fora do horário
- ✅ Usuário pode ativar/desativar facilmente
- ✅ Logs mostram respostas enviadas

**Estimativa:** 16 horas de desenvolvimento

---

### **Sprint 6: Onboarding & Polish (Dias 23-24)**

#### 🎓 Task 4.4: Onboarding de Usuários (2 dias)
**Prioridade:** 🟡 ALTA  
**Valor de Negócio:** Alta conversão

**Subtasks:**
- [ ] Backend:
  - [ ] Campo `onboardingCompleted` no User
  - [ ] Endpoint POST `/api/onboarding/complete`
- [ ] Frontend:
  - [ ] Tour guiado com react-joyride ou intro.js
  - [ ] 5 etapas:
    1. Bem-vindo ao WhatsAI
    2. Crie sua primeira instância
    3. Conecte ao WhatsApp
    4. Envie sua primeira mensagem
    5. Explore templates e automação
  - [ ] Checklist de setup no dashboard
  - [ ] Vídeos tutoriais embarcados (YouTube)
  - [ ] Modal de boas-vindas no primeiro login
  - [ ] Botão "Pular tutorial"
- [ ] Documentação:
  - [ ] Criar `/docs` com Docusaurus ou similar
  - [ ] Guia de início rápido
  - [ ] FAQ com perguntas comuns
  - [ ] Troubleshooting guide

**Critérios de Aceitação:**
- ✅ Tour guiado funciona perfeitamente
- ✅ Checklist guia usuário passo a passo
- ✅ Vídeos explicativos são claros
- ✅ Documentação está completa
- ✅ FAQ responde dúvidas comuns

**Estimativa:** 16 horas de desenvolvimento

---

## 📈 Resultado da FASE 4

Ao final desta fase, teremos:
- ✅ Sistema de pagamentos Stripe 100% funcional
- ✅ Multi-tenancy com organizações e roles
- ✅ Automação básica (respostas automáticas)
- ✅ Onboarding que converte usuários
- ✅ Documentação completa

**Status:** Produto comercializável pronto para lançamento

---

## 🎯 FASE 5 - Lançamento (Semanas 5-6)

**Objetivo:** Preparar infraestrutura e lançar para primeiros clientes  
**Duração:** 10 dias úteis  
**Entregável:** Produto no ar com primeiros clientes pagantes

### **Sprint 7: Infraestrutura & Deploy (Dias 25-29)**

#### ☁️ Task 5.1: Deploy em Produção (3 dias)
**Prioridade:** 🔴 CRÍTICA

**Subtasks:**
- [ ] Infraestrutura:
  - [ ] Setup DigitalOcean Droplet (4GB RAM)
  - [ ] PostgreSQL gerenciado (DO Managed Database)
  - [ ] Redis gerenciado (para filas)
  - [ ] Spaces configurado corretamente
  - [ ] Nginx como reverse proxy
  - [ ] SSL com Let's Encrypt
  - [ ] Domínio apontando (app.whatsai.com.br)
- [ ] Deploy:
  - [ ] Docker Compose para produção
  - [ ] CI/CD com GitHub Actions
  - [ ] Variáveis de ambiente seguras
  - [ ] Backup automático do banco (diário)
  - [ ] Logs centralizados (Papertrail ou Logtail)
  - [ ] Monitoramento (UptimeRobot)
- [ ] Segurança:
  - [ ] Rate limiting global (express-rate-limit)
  - [ ] Helmet.js para headers de segurança
  - [ ] CORS configurado corretamente
  - [ ] Sanitização de inputs
  - [ ] Secrets no GitHub Secrets

**Critérios de Aceitação:**
- ✅ Aplicação roda em produção sem erros
- ✅ SSL funciona (HTTPS)
- ✅ Backups automáticos configurados
- ✅ Logs são centralizados
- ✅ Uptime monitorado 24/7
- ✅ Deploy automático via GitHub Actions

**Estimativa:** 24 horas de DevOps

---

#### 🌐 Task 5.2: Landing Page (2 dias)
**Prioridade:** 🟡 ALTA

**Subtasks:**
- [ ] Design:
  - [ ] Hero section com proposta de valor clara
  - [ ] Seção de features (com screenshots)
  - [ ] Seção de preços (planos)
  - [ ] Depoimentos (mesmo que mockados inicialmente)
  - [ ] FAQ
  - [ ] Footer com links legais
- [ ] Desenvolvimento:
  - [ ] Next.js ou Astro (SEO otimizado)
  - [ ] Formulário de contato (integrado com email)
  - [ ] CTA para "Começar Grátis"
  - [ ] Analytics (Google Analytics 4)
  - [ ] Pixel do Facebook (para remarketing)
- [ ] Conteúdo:
  - [ ] Copywriting persuasivo
  - [ ] Screenshots do produto
  - [ ] Vídeo demo (1-2 minutos)

**Critérios de Aceitação:**
- ✅ Landing page carrega em <2s
- ✅ Mobile responsivo perfeito
- ✅ CTAs claros e funcionais
- ✅ Analytics rastreando conversões
- ✅ SEO básico configurado

**Estimativa:** 16 horas de desenvolvimento

---

### **Sprint 8: Lançamento & Marketing (Dias 30-34)**

#### 📣 Task 5.3: Lançamento Beta (5 dias)
**Prioridade:** 🔴 CRÍTICA

**Subtasks:**
- [ ] Pré-lançamento:
  - [ ] Lista de 10-20 beta testers (amigos, conhecidos)
  - [ ] Email de convite personalizado
  - [ ] Formulário de feedback estruturado
  - [ ] Grupo no WhatsApp/Telegram para suporte
- [ ] Lançamento:
  - [ ] Post no LinkedIn anunciando
  - [ ] Post em grupos de WhatsApp/Telegram relevantes
  - [ ] Post no Reddit (r/SaaS, r/entrepreneur)
  - [ ] Post no Product Hunt (se aplicável)
  - [ ] Email para contatos da rede
- [ ] Marketing inicial:
  - [ ] Criar perfil no Instagram (@whatsai.oficial)
  - [ ] Postar cases de uso (carrosséis)
  - [ ] Criar canal no YouTube (tutoriais)
  - [ ] Blog com 3-5 artigos iniciais (SEO)
- [ ] Suporte:
  - [ ] Chat de suporte (Intercom ou Crisp)
  - [ ] Email de suporte (suporte@whatsai.com.br)
  - [ ] SLA de resposta <4 horas

**Critérios de Aceitação:**
- ✅ 10+ beta testers ativos
- ✅ Feedback coletado e priorizado
- ✅ Pelo menos 1 cliente pagante
- ✅ NPS >7
- ✅ Bugs críticos corrigidos em <24h

**Estimativa:** 40 horas de trabalho (marketing + suporte)

---

## 📊 Métricas de Sucesso

### KPIs para MVP
- **Usuários:** 50 cadastros no primeiro mês
- **Conversão:** 10% de free para pago (5 clientes pagantes)
- **Churn:** <20% ao mês
- **NPS:** >7
- **Uptime:** >99%
- **Tempo de resposta:** <500ms (p95)

### Metas Financeiras
- **MRR Mês 1:** R$ 500 (5 clientes × R$ 97)
- **MRR Mês 3:** R$ 2.000 (20 clientes)
- **MRR Mês 6:** R$ 5.000 (50 clientes)

---

## 🛠️ Stack Tecnológico Final

### Backend
- **Runtime:** Node.js 20 LTS + TypeScript
- **Framework:** Express.js
- **ORM:** Prisma (PostgreSQL)
- **Cache:** Redis + cache-manager
- **Queue:** BullMQ (Redis)
- **Storage:** DigitalOcean Spaces (S3-compatible)
- **Logs:** Winston + Papertrail
- **Tests:** Jest + Supertest

### Frontend
- **Framework:** React 19 + TypeScript
- **Build:** Vite
- **State:** Zustand
- **UI:** DaisyUI + TailwindCSS
- **Forms:** React Hook Form + Zod
- **Charts:** Recharts
- **Tests:** Vitest + Testing Library

### Infrastructure
- **Hosting:** DigitalOcean Droplets
- **Database:** DigitalOcean Managed PostgreSQL
- **Cache/Queue:** DigitalOcean Managed Redis
- **Storage:** DigitalOcean Spaces
- **CDN:** Cloudflare
- **DNS:** Cloudflare
- **SSL:** Let's Encrypt
- **CI/CD:** GitHub Actions
- **Monitoring:** UptimeRobot + Sentry

### Payments
- **Stripe:** Assinaturas recorrentes
- **Mercado Pago:** Opção para Brasil (FASE 6)

---

## 📅 Cronograma Resumido

| Semana | Fase | Entregáveis | Horas |
|--------|------|-------------|-------|
| 1 | FASE 3.1 | Storage S3 + Dashboard Real | 40h |
| 2 | FASE 3.2 | Templates + Bulk Messages | 64h |
| 3 | FASE 4.1 | Stripe + Limites | 56h |
| 4 | FASE 4.2 | Organizações + Automação | 40h |
| 5 | FASE 5.1 | Deploy + Landing Page | 40h |
| 6 | FASE 5.2 | Lançamento Beta + Marketing | 40h |
| **TOTAL** | | **MVP Comercializável** | **280h** |

**Estimativa:** 280 horas = 35 dias úteis (8h/dia) = **7 semanas de trabalho focado**

Com ritmo acelerado e foco: **5-6 semanas é viável**

---

## 🚀 Próximos Passos Imediatos

### Esta Semana (Dias 1-5)
1. ✅ **Commitar código atual** (otimizações já feitas)
2. ✅ **Atualizar .gitignore** (logs, .bak)
3. ✅ **Atualizar README** (performance improvements)
4. 🔄 **Começar Task 3.1** (Storage S3 completo)

### Semana Seguinte (Dias 6-10)
1. ✅ **Finalizar Storage S3**
2. ✅ **Dashboard com dados reais**
3. 🔄 **Começar sistema de templates**

---

## 📝 Notas Importantes

### Decisões de Arquitetura
- **Monolito primeiro:** Mais rápido para MVP, microservices depois
- **PostgreSQL suficiente:** Não precisa de banco separado para filas ainda
- **Redis essencial:** Para cache, filas e rate limiting
- **Stripe prioritário:** Mercado Pago na FASE 6

### Riscos e Mitigações
- **Risco:** Bloqueio do WhatsApp por envio em massa
  - **Mitigação:** Rate limiting agressivo (10 msg/min máximo)
- **Risco:** Custos de infra crescerem rápido
  - **Mitigação:** Monitoramento de custos, alertas
- **Risco:** Bugs em produção afetarem clientes
  - **Mitigação:** Testes automatizados, CI/CD, rollback rápido

### Quando Pausar e Validar
- **Após FASE 3:** Testar com 3-5 usuários beta (validar produto)
- **Após FASE 4:** Conseguir primeiro cliente pagante (validar preço)
- **Após FASE 5:** Analisar métricas, ajustar roadmap

---

## 🎯 Critério de Sucesso do MVP

O MVP será considerado bem-sucedido quando:
- ✅ 5+ clientes pagantes ativos
- ✅ Produto roda 99%+ do tempo sem bugs críticos
- ✅ Usuários conseguem enviar 1000+ mensagens/dia sem problemas
- ✅ NPS >7 (usuários recomendam)
- ✅ Churn <20%
- ✅ MRR crescendo 20%+ ao mês

---

**Pronto para começar a FASE 3?** 🚀

Próximo comando: `git add . && git commit -m "docs: MVP roadmap - plano completo para comercialização"`
