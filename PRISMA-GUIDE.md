# 🗄️ Guia de Configuração do Prisma - WhatsAI

Este guia mostra como configurar e usar o Prisma ORM no projeto WhatsAI.

## ✅ STATUS ATUAL

**Prisma está CONFIGURADO e FUNCIONANDO perfeitamente!**

- ✅ Prisma Client gerado
- ✅ Database SQLite sincronizado
- ✅ 1 instância já cadastrada
- ✅ Repository pattern implementado

---

## 📊 SCHEMA ATUAL

O projeto usa **SQLite** para desenvolvimento com o seguinte schema:

### Modelos:

1. **WhatsAppInstance** - Gerencia instâncias do WhatsApp
2. **Message** - Armazena mensagens enviadas/recebidas
3. **WebhookEvent** - Registra eventos de webhooks

### Localização:
- **Schema atual:** `prisma/schema.prisma` (SQLite)
- **Schema PostgreSQL:** `prisma/schema.postgresql.prisma` (pronto para migração)
- **Database:** `prisma/dev.db`

---

## 🚀 COMANDOS DO PRISMA

### Desenvolvimento (Comandos mais usados)

```bash
# Gerar Prisma Client (após alterar schema)
npm run db:generate

# Sincronizar schema com banco (desenvolvimento)
npm run db:push

# Abrir Prisma Studio (GUI para visualizar dados)
npm run db:studio
```

### Produção

```bash
# Criar migration (recomendado para produção)
npm run db:migrate

# Aplicar migrations
npx prisma migrate deploy
```

---

## 🔄 MIGRAÇÃO SQLITE → POSTGRESQL

### Quando migrar?

Migre para PostgreSQL quando:
- Precisar de melhor performance
- Tiver múltiplos servidores
- Precisar de recursos avançados de BD
- For colocar em produção em grande escala

### Como migrar:

#### Passo 1: Configurar PostgreSQL

**Opção A: Docker Compose**

Edite `docker-compose.yml` e descomente:

```yaml
postgres:
  image: postgres:15-alpine
  container_name: whatsai-postgres
  environment:
    POSTGRES_USER: whatsai
    POSTGRES_PASSWORD: whatsai_password
    POSTGRES_DB: whatsai
  ports:
    - "5432:5432"
  volumes:
    - postgres-data:/var/lib/postgresql/data
```

Inicie:
```bash
docker-compose up -d postgres
```

**Opção B: PostgreSQL Local**

Instale PostgreSQL e crie um banco:
```sql
CREATE DATABASE whatsai;
CREATE USER whatsai WITH PASSWORD 'whatsai_password';
GRANT ALL PRIVILEGES ON DATABASE whatsai TO whatsai;
```

#### Passo 2: Atualizar .env

```env
# Antes (SQLite)
DATABASE_URL="file:./dev.db"

# Depois (PostgreSQL)
DATABASE_URL="postgresql://whatsai:whatsai_password@localhost:5432/whatsai"

# Docker
DATABASE_URL="postgresql://whatsai:whatsai_password@postgres:5432/whatsai"
```

#### Passo 3: Substituir Schema

```bash
# Backup do schema atual
cp prisma/schema.prisma prisma/schema.prisma.sqlite.bak

# Usar schema PostgreSQL
cp prisma/schema.postgresql.prisma prisma/schema.prisma
```

#### Passo 4: Criar Migrations

```bash
# Gerar migration inicial
npm run db:migrate

# Vai criar: prisma/migrations/XXXXXX_init/migration.sql
```

#### Passo 5: Gerar Prisma Client

```bash
npm run db:generate
```

#### Passo 6: Testar

```bash
npm run dev
```

---

## 🔍 PRISMA STUDIO

Interface gráfica para visualizar e editar dados do banco.

### Iniciar:

```bash
npm run db:studio
```

Abre em: `http://localhost:5555`

### Funcionalidades:

- 📊 Visualizar todas as tabelas
- ✏️ Editar registros
- ➕ Adicionar novos registros
- 🗑️ Deletar registros
- 🔍 Filtrar e buscar
- 🔗 Navegar por relações

---

## 📝 USANDO O PRISMA NO CÓDIGO

### Exemplo: Criar Instância

```typescript
import { prisma } from './database/prisma';

// Criar
const instance = await prisma.whatsAppInstance.create({
  data: {
    name: 'Minha Instância',
    evolutionInstanceName: 'whatsai_instance_1',
    evolutionApiUrl: 'https://api.evolution.com',
    evolutionApiKey: 'key123',
    status: 'PENDING',
  },
});
```

### Exemplo: Listar Instâncias

```typescript
// Listar todas
const instances = await prisma.whatsAppInstance.findMany({
  orderBy: { createdAt: 'desc' },
});

// Buscar por ID
const instance = await prisma.whatsAppInstance.findUnique({
  where: { id: 'instance-id' },
  include: { messages: true }, // Incluir mensagens
});
```

### Exemplo: Atualizar Status

```typescript
await prisma.whatsAppInstance.update({
  where: { id: 'instance-id' },
  data: {
    status: 'CONNECTED',
    connected: true,
    connectedAt: new Date(),
  },
});
```

### Exemplo: Deletar Instância

```typescript
await prisma.whatsAppInstance.delete({
  where: { id: 'instance-id' },
});
```

### Exemplo: Salvar Mensagem

```typescript
await prisma.message.create({
  data: {
    instanceId: 'instance-id',
    remoteJid: '5511999999999@s.whatsapp.net',
    fromMe: true,
    messageType: 'TEXT',
    content: 'Olá!',
    messageId: 'msg-id-123',
    timestamp: new Date(),
  },
});
```

---

## 🔧 ALTERANDO O SCHEMA

### 1. Editar `prisma/schema.prisma`

Exemplo: Adicionar campo:

```prisma
model WhatsAppInstance {
  id          String   @id @default(cuid())
  name        String
  description String?  // NOVO CAMPO
  // ... resto dos campos
}
```

### 2. Aplicar Mudança

**Desenvolvimento:**
```bash
npm run db:push
```

**Produção:**
```bash
npm run db:migrate
```

### 3. Regenerar Client

```bash
npm run db:generate
```

### 4. Atualizar TypeScript

O Prisma Client é atualizado automaticamente com os novos tipos!

---

## 🐛 TROUBLESHOOTING

### Erro: "Prisma Client não gerado"

```bash
npm run db:generate
```

### Erro: "Schema out of sync"

```bash
npm run db:push
```

### Erro: "Cannot connect to database"

Verifique DATABASE_URL no `.env`:

```bash
# Ver valor atual
echo $env:DATABASE_URL  # PowerShell
```

### Banco corrompido

```bash
# Deletar e recriar
rm prisma/dev.db
npm run db:push
```

### Migration falhou

```bash
# Resetar migrations (CUIDADO: apaga dados)
npx prisma migrate reset

# Recriar
npm run db:migrate
```

---

## 📊 COMPARAÇÃO SQLite vs PostgreSQL

| Característica | SQLite | PostgreSQL |
|---------------|--------|------------|
| **Setup** | Muito fácil | Requer servidor |
| **Performance** | Boa para pequeno | Excelente |
| **Concorrência** | Limitada | Alta |
| **Recursos** | Básicos | Avançados |
| **Recomendado para** | Desenvolvimento | Produção |
| **Custo** | Grátis | Grátis (pode ter hosting) |

---

## 🎯 MELHORES PRÁTICAS

### 1. Use Transactions

```typescript
await prisma.$transaction(async (tx) => {
  const instance = await tx.whatsAppInstance.create({ ... });
  await tx.message.create({ ... });
});
```

### 2. Use Índices

```prisma
@@index([status])
@@index([createdAt])
```

### 3. Use Relations

```prisma
model Message {
  instance WhatsAppInstance @relation(fields: [instanceId], references: [id])
}
```

### 4. Valide Dados

```typescript
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(3),
});
```

### 5. Use Repository Pattern

Já implementado em `src/database/repositories/`

---

## 📦 BACKUP E RESTORE

### SQLite

```bash
# Backup
cp prisma/dev.db prisma/backup-$(date +%Y%m%d).db

# Restore
cp prisma/backup-20250101.db prisma/dev.db
```

### PostgreSQL

```bash
# Backup
docker-compose exec postgres pg_dump -U whatsai whatsai > backup.sql

# Restore
docker-compose exec -T postgres psql -U whatsai whatsai < backup.sql
```

---

## 🔐 SEGURANÇA

### Nunca commitar:

- ❌ `prisma/dev.db` (adicionar ao .gitignore)
- ❌ `.env` com credenciais reais
- ✅ Apenas `schema.prisma` e migrations

### Em produção:

- Use variáveis de ambiente
- Criptografe connection strings
- Use SSL para PostgreSQL
- Limite permissões do usuário do banco

---

## 📚 RECURSOS

- [Documentação Prisma](https://www.prisma.io/docs)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)

---

## ✅ CHECKLIST DE CONFIGURAÇÃO

- [x] ✅ Prisma instalado
- [x] ✅ Schema definido
- [x] ✅ Database sincronizado
- [x] ✅ Prisma Client gerado
- [x] ✅ Repository pattern implementado
- [x] ✅ Migrations prontas
- [ ] 🔄 Migrar para PostgreSQL (opcional)
- [ ] 🔄 Configurar backups automáticos (produção)
- [ ] 🔄 Configurar monitoring (produção)

---

**Status:** 🟢 **PRISMA CONFIGURADO E FUNCIONANDO**

Seu Prisma está pronto para uso! 🚀
