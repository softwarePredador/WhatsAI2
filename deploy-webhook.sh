#!/bin/bash
# deploy-webhook.sh - Script para fazer deploy do webhook no Digital Ocean

echo "🚀 Deploy Webhook Receiver para Digital Ocean"
echo "============================================="

# Configurações
SERVER_IP="143.198.230.247"
SERVER_USER="root"  # ou seu usuário
WEBHOOK_DIR="/opt/webhook-receiver"

echo "📦 Preparando arquivos para upload..."

# Criar package.json mínimo para o servidor
cat > webhook-package.json << EOF
{
  "name": "webhook-receiver",
  "version": "1.0.0",
  "description": "Webhook receiver for WhatsAI",
  "main": "webhook-receiver.js",
  "scripts": {
    "start": "node webhook-receiver.js",
    "dev": "nodemon webhook-receiver.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "@prisma/client": "^5.0.0",
    "prisma": "^5.0.0"
  }
}
EOF

echo "📁 Criando diretório no servidor..."
ssh $SERVER_USER@$SERVER_IP "mkdir -p $WEBHOOK_DIR"

echo "📤 Enviando arquivos..."
scp webhook-receiver.js $SERVER_USER@$SERVER_IP:$WEBHOOK_DIR/
scp webhook-package.json $SERVER_USER@$SERVER_IP:$WEBHOOK_DIR/package.json
scp server/prisma/schema.prisma $SERVER_USER@$SERVER_IP:$WEBHOOK_DIR/

echo "🔧 Instalando dependências no servidor..."
ssh $SERVER_USER@$SERVER_IP "cd $WEBHOOK_DIR && npm install"

echo "🗄️ Configurando banco EasyPanel..."
ssh $SERVER_USER@$SERVER_IP "cd $WEBHOOK_DIR && export DATABASE_URL='postgres://postgres:78ffa3b05805066f6719@banco_halder-db:5432/halder?sslmode=disable'"

echo "🗄️ Gerando Prisma Client..."
ssh $SERVER_USER@$SERVER_IP "cd $WEBHOOK_DIR && DATABASE_URL='postgres://postgres:78ffa3b05805066f6719@banco_halder-db:5432/halder?sslmode=disable' npx prisma generate"

echo "🎯 Iniciando webhook receiver..."
ssh $SERVER_USER@$SERVER_IP "cd $WEBHOOK_DIR && DATABASE_URL='postgres://postgres:78ffa3b05805066f6719@banco_halder-db:5432/halder?sslmode=disable' pm2 start webhook-receiver.js --name webhook-receiver || DATABASE_URL='postgres://postgres:78ffa3b05805066f6719@banco_halder-db:5432/halder?sslmode=disable' node webhook-receiver.js &"

echo "✅ Deploy concluído!"
echo ""
echo "🌐 Webhook URL: http://$SERVER_IP:3001/api/webhooks/evolution/cmh250j8e0001s1sh1i19esvz"
echo "🔍 Health Check: http://$SERVER_IP:3001/health"
echo ""
echo "📋 Para atualizar o webhook na Evolution API:"
echo "   URL: http://$SERVER_IP:3001/api/webhooks/evolution/cmh250j8e0001s1sh1i19esvz"
echo "   Events: MESSAGES_UPSERT"

# Limpar arquivos temporários
rm webhook-package.json