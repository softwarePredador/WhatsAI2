FROM node:20-slim

WORKDIR /app

# Instalar OpenSSL (necessário para Prisma)
RUN apt-get update -y && apt-get install -y openssl

# Copiar arquivos
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependências
RUN npm install

# Gerar Prisma Client
RUN npx prisma generate

# Copiar código
COPY . .

# Expor porta
EXPOSE 3002

# Iniciar
CMD ["node", "index.js"]
