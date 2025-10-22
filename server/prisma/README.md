# 🔄 Schemas do Prisma

Este diretório contém os schemas do Prisma para diferentes bancos de dados.

## 📁 Arquivos

### `schema.prisma` (ATIVO)
Schema **atualmente em uso** com **SQLite** para desenvolvimento.

- ✅ **Status:** Ativo e funcionando
- 💾 **Database:** SQLite (`dev.db`)
- 🎯 **Uso:** Desenvolvimento local

### `schema.postgresql.prisma.example` (BACKUP)
Schema de **exemplo para PostgreSQL** para quando você quiser migrar.

- 📦 **Status:** Template/Exemplo
- 💾 **Database:** PostgreSQL
- 🎯 **Uso:** Produção (quando migrar)

---

## 🔄 Como Migrar para PostgreSQL

### Passo 1: Backup do Schema Atual

```bash
# Windows PowerShell
Copy-Item prisma\schema.prisma prisma\schema.sqlite.backup

# Linux/Mac
cp prisma/schema.prisma prisma/schema.sqlite.backup
```

### Passo 2: Substituir o Schema

```bash
# Windows PowerShell
Copy-Item prisma\schema.postgresql.prisma.example prisma\schema.prisma -Force

# Linux/Mac
cp prisma/schema.postgresql.prisma.example prisma/schema.prisma
```

### Passo 3: Atualizar DATABASE_URL

Edite o arquivo `.env`:

```env
# Antes (SQLite)
DATABASE_URL="file:./dev.db"

# Depois (PostgreSQL)
DATABASE_URL="postgresql://whatsai:password@localhost:5432/whatsai"
```

### Passo 4: Gerar Migration

```bash
npm run db:migrate
```

### Passo 5: Gerar Prisma Client

```bash
npm run db:generate
```

### Passo 6: Testar

```bash
npm run dev
```

---

## ⚠️ IMPORTANTE

**NÃO renomeie o arquivo `.example` de volta para `.prisma` sem fazer backup!**

O Prisma só pode ter **UM schema ativo** por vez. Se você criar um segundo arquivo `.prisma`, vai dar erro de duplicação.

---

## 🔙 Como Voltar para SQLite

Se precisar voltar para SQLite:

```bash
# 1. Restaurar backup
Copy-Item prisma\schema.sqlite.backup prisma\schema.prisma -Force

# 2. Atualizar .env
# DATABASE_URL="file:./dev.db"

# 3. Sincronizar
npm run db:push
```

---

## 📊 Diferenças entre os Schemas

| Característica | SQLite (atual) | PostgreSQL (example) |
|---------------|----------------|---------------------|
| **Tipos** | Strings literais | Enums nativos |
| **Performance** | Boa para dev | Excelente |
| **Texto Longo** | `String` | `@db.Text` |
| **Status** | String | Enum `InstanceStatus` |
| **MessageType** | String | Enum `MessageType` |

---

## 🎯 Recomendação

- **Desenvolvimento:** Use `schema.prisma` (SQLite) ✅ - **ATUAL**
- **Produção:** Migre para `schema.postgresql.prisma.example` (PostgreSQL)

---

**Atualmente ativo:** `schema.prisma` (SQLite) ✅
