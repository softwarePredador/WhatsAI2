# 🚀 Como Usar o Docker no WhatsAI

Este guia mostra como usar o Docker com o projeto WhatsAI Multi-Instance Manager.

## 📋 Pré-requisitos

- Docker instalado ([Download Docker](https://www.docker.com/products/docker-desktop))
- Docker Compose instalado (geralmente vem com Docker Desktop)

## 🏃 Início Rápido

### Desenvolvimento (com hot reload)

```bash
# Iniciar em modo desenvolvimento
docker-compose -f docker-compose.dev.yml up

# Ou em background
docker-compose -f docker-compose.dev.yml up -d

# Ver logs
docker-compose -f docker-compose.dev.yml logs -f

# Parar
docker-compose -f docker-compose.dev.yml down
```

### Produção

```bash
# Build e iniciar
docker-compose up --build -d

# Ver logs
docker-compose logs -f whatsai

# Parar
docker-compose down

# Parar e remover volumes
docker-compose down -v
```

## 🔧 Configuração

### 1. Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Application
NODE_ENV=production
PORT=5173

# Evolution API
EVOLUTION_API_URL=https://hsapi.studio/
EVOLUTION_API_KEY=Pz6qEerZE5IYwaoc8ZCQxmBdLAinX4dl

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key

# Database (SQLite por padrão)
DATABASE_URL=file:./data/dev.db
```

### 2. Usando PostgreSQL (Opcional)

Edite o `docker-compose.yml` e descomente a seção do PostgreSQL:

```yaml
# Descomentar estas linhas:
postgres:
  image: postgres:15-alpine
  # ... resto da configuração
```

Então atualize o `.env`:

```env
DATABASE_URL=postgresql://whatsai:whatsai_password@postgres:5432/whatsai
```

E no `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

## 📦 Comandos Úteis

### Build

```bash
# Rebuild forçado
docker-compose build --no-cache

# Build específico
docker-compose build whatsai
```

### Logs

```bash
# Ver todos os logs
docker-compose logs

# Seguir logs em tempo real
docker-compose logs -f

# Logs de um serviço específico
docker-compose logs -f whatsai
```

### Executar Comandos

```bash
# Executar comando dentro do container
docker-compose exec whatsai npm run db:studio

# Acessar shell do container
docker-compose exec whatsai sh

# Executar comando único
docker-compose run --rm whatsai npm run db:migrate
```

### Limpeza

```bash
# Parar e remover containers
docker-compose down

# Remover também volumes
docker-compose down -v

# Remover imagens não usadas
docker image prune -a
```

## 🐛 Troubleshooting

### Porta já em uso

Se a porta 5173 já estiver em uso, altere no `docker-compose.yml`:

```yaml
ports:
  - "3001:5173"  # Usar porta 3001 no host
```

### Banco de dados corrompido

```bash
# Remover volume do banco
docker-compose down -v

# Reiniciar
docker-compose up -d
```

### Build falha

```bash
# Limpar cache do Docker
docker builder prune -a

# Rebuild sem cache
docker-compose build --no-cache
```

## 🔍 Health Check

Verificar se o container está saudável:

```bash
# Ver status
docker-compose ps

# Testar endpoint de health
curl http://localhost:5173/health
```

## 🚀 Deploy em Produção

### Docker Swarm

```bash
# Inicializar swarm
docker swarm init

# Deploy
docker stack deploy -c docker-compose.yml whatsai

# Ver serviços
docker service ls

# Ver logs
docker service logs -f whatsai_whatsai
```

### Kubernetes

Exemplo de deployment:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: whatsai
spec:
  replicas: 3
  selector:
    matchLabels:
      app: whatsai
  template:
    metadata:
      labels:
        app: whatsai
    spec:
      containers:
      - name: whatsai
        image: whatsai:latest
        ports:
        - containerPort: 5173
        env:
        - name: NODE_ENV
          value: "production"
        - name: EVOLUTION_API_URL
          valueFrom:
            secretKeyRef:
              name: whatsai-secrets
              key: evolution-url
```

## 📊 Monitoramento

### Ver uso de recursos

```bash
# Stats em tempo real
docker stats

# Stats de um container específico
docker stats whatsai-manager
```

### Inspecionar container

```bash
docker inspect whatsai-manager
```

## 🔐 Segurança

### Melhores Práticas

1. **Nunca commitar o .env com credenciais reais**
2. **Use Docker secrets em produção:**

```bash
# Criar secret
echo "my-api-key" | docker secret create evolution_api_key -

# Usar no docker-compose:
secrets:
  evolution_api_key:
    external: true
```

3. **Rode como usuário não-root:**

Adicione ao Dockerfile:

```dockerfile
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs
```

## 🎯 Multi-Stage Build

O Dockerfile usa multi-stage build para otimização:

```dockerfile
# Stage 1: Build
FROM node:18-alpine AS builder
# ... build da aplicação

# Stage 2: Production
FROM node:18-alpine
# ... apenas arquivos necessários
```

Benefícios:
- Imagem final menor
- Mais seguro (sem ferramentas de build)
- Build mais rápido em CI/CD

## 📝 Notas Importantes

1. **Volumes**: Os dados do SQLite são persistidos em `./prisma/data`
2. **Hot Reload**: Funciona apenas no `docker-compose.dev.yml`
3. **Debug**: Porta 9229 exposta para debug remoto no modo dev
4. **Health Check**: Container reinicia automaticamente se falhar

## 🆘 Suporte

Se tiver problemas:

1. Verificar logs: `docker-compose logs -f`
2. Verificar health: `docker-compose ps`
3. Reconstruir: `docker-compose up --build --force-recreate`
4. Limpar tudo: `docker-compose down -v && docker system prune -a`
