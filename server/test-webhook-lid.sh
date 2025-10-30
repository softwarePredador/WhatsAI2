#!/bin/bash

# Script para testar webhook com @lid
# Envia um webhook simulado para o endpoint local

INSTANCE_ID="sua-instancia-aqui"
WEBHOOK_URL="http://localhost:3000/api/webhooks/evolution/$INSTANCE_ID"

echo "🧪 Enviando webhook de teste com @lid..."
echo "URL: $WEBHOOK_URL"
echo ""

# Webhook simulado com @lid e campos Alt
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{
  "event": "messages.upsert",
  "instance": "'"$INSTANCE_ID"'",
  "data": {
    "key": {
      "remoteJid": "120363321708924123@g.us",
      "fromMe": false,
      "id": "TEST_MESSAGE_ID_001",
      "participant": "79512746377469@lid",
      "participantAlt": "5541998773200@s.whatsapp.net"
    },
    "message": {
      "conversation": "Mensagem de teste para verificar @lid"
    },
    "messageType": "conversation",
    "messageTimestamp": '$(date +%s)',
    "pushName": "Teste @lid"
  },
  "destination": "'"$INSTANCE_ID"'",
  "date_time": "'$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")'",
  "sender": "test",
  "server_url": "http://localhost:8080",
  "apikey": "test-key"
}'

echo ""
echo ""
echo "✅ Webhook enviado! Verifique os logs do servidor."
echo ""
echo "Para ver os logs salvos, execute:"
echo "  npx tsx analyze-webhook-logs.ts"
