# 🔍 QR Code Troubleshooting Guide

## 📱 Common QR Code Issues & Solutions

### 🚫 Issue: QR Code Not Appearing

#### **Symptoms:**
- API returns `null` for `qrCode` field
- Frontend shows "No QR Code available"
- Instance status stuck on "PENDING"

#### **Possible Causes & Solutions:**

1. **Evolution API Server Not Running**
   ```bash
   # Check if Evolution API is accessible
   curl -I http://your-evolution-api-url:8080
   
   # Should return HTTP 200 OK
   ```
   
   **Solution:** Start your Evolution API server

2. **Invalid API Key**
   ```bash
   # Test API key
   curl -X GET "http://your-evolution-api-url:8080/instance/fetchInstances" \
     -H "apikey: your-api-key"
   ```
   
   **Solution:** Verify your API key in `.env` file

3. **Instance Not Created in Evolution API**
   ```bash
   # Check if instance exists in Evolution API
   curl -X GET "http://your-evolution-api-url:8080/instance/fetchInstances" \
     -H "apikey: your-api-key"
   ```
   
   **Solution:** Connect the instance first:
   ```http
   POST /api/instances/:instanceId/connect
   ```

4. **Network Connectivity Issues**
   ```bash
   # Test connectivity from your server
   ping your-evolution-api-host
   telnet your-evolution-api-host 8080
   ```

---

### ⏰ Issue: QR Code Expired/Old

#### **Symptoms:**
- WhatsApp shows "QR code expired" when scanning
- QR Code displayed but won't connect
- Status remains "CONNECTING" after scanning

#### **Solutions:**

1. **Force QR Code Refresh**
   ```http
   POST /api/instances/:instanceId/force-qr-update
   Authorization: Bearer your_token
   ```

2. **Automatic Refresh Check**
   - QR codes auto-refresh every 30 seconds when status is "CONNECTING"
   - Check if WebSocket connections are working properly

3. **Manual Instance Restart**
   ```bash
   # Disconnect and reconnect
   curl -X POST "http://localhost:3001/api/instances/INSTANCE_ID/disconnect" \
     -H "Authorization: Bearer $TOKEN"
   
   sleep 2
   
   curl -X POST "http://localhost:3001/api/instances/INSTANCE_ID/connect" \
     -H "Authorization: Bearer $TOKEN"
   ```

---

### 🔄 Issue: QR Code Not Updating

#### **Symptoms:**
- Same QR code displayed for extended periods
- Auto-refresh not working
- Manual refresh doesn't generate new QR

#### **Diagnostic Steps:**

1. **Check Instance Status**
   ```http
   GET /api/instances/:instanceId
   ```
   
   QR codes only refresh when status is "CONNECTING"

2. **Verify WebSocket Connection**
   ```javascript
   // In browser console
   socket.on('qr_code', (data) => {
     console.log('QR Code updated:', data.timestamp);
   });
   ```

3. **Check Evolution API Response**
   ```bash
   curl -X GET "http://your-evolution-api-url:8080/instance/connect/YOUR_INSTANCE_NAME" \
     -H "apikey: your-api-key"
   ```

#### **Solutions:**

1. **Restart Auto-refresh Service**
   ```bash
   # Restart your Node.js application
   pm2 restart whatsai
   # or
   npm run dev
   ```

2. **Clear Instance Cache**
   ```http
   DELETE /api/instances/:instanceId
   ```
   Then create a new instance

---

### 📱 Issue: QR Code Scanned But Not Connecting

#### **Symptoms:**
- QR code scans successfully on WhatsApp
- Instance status doesn't change to "CONNECTED"
- WhatsApp shows "Connecting..." indefinitely

#### **Diagnostic Steps:**

1. **Check Evolution API Logs**
   ```bash
   # Check Evolution API container logs
   docker logs evolution-api
   
   # Look for connection events
   grep "whatsai_" /path/to/evolution/logs/
   ```

2. **Verify Webhook Configuration**
   ```bash
   # Check if webhooks are being received
   curl -X GET "http://localhost:3001/api/instances/INSTANCE_ID" \
     -H "Authorization: Bearer $TOKEN"
   ```

3. **Test WhatsApp Connection**
   ```bash
   # Check connection state directly in Evolution API
   curl -X GET "http://your-evolution-api-url:8080/instance/connectionState/YOUR_INSTANCE_NAME" \
     -H "apikey: your-api-key"
   ```

#### **Solutions:**

1. **Wait for Connection Timeout**
   - Sometimes connection takes 30-60 seconds
   - Monitor status changes via WebSocket

2. **Restart Evolution API Instance**
   ```bash
   curl -X POST "http://your-evolution-api-url:8080/instance/restart/YOUR_INSTANCE_NAME" \
     -H "apikey: your-api-key"
   ```

3. **Check Firewall/Network**
   - Ensure WhatsApp can reach your webhook URL
   - Verify ports 443/80 are open for webhooks

---

### 🖼️ Issue: QR Code Display Problems

#### **Symptoms:**
- QR code appears corrupted/pixelated
- Base64 data seems invalid
- QR code scanner can't read it

#### **Solutions:**

1. **Verify Base64 Format**
   ```javascript
   // QR code should start with: data:image/png;base64,
   console.log(qrCode.substring(0, 50));
   ```

2. **Check Image Size**
   ```javascript
   // Decode and check image
   const img = new Image();
   img.onload = () => {
     console.log(`QR Code dimensions: ${img.width}x${img.height}`);
   };
   img.src = qrCode;
   ```

3. **Re-request QR Code**
   ```http
   GET /api/instances/:instanceId/qr
   Authorization: Bearer your_token
   ```

---

## 🔧 Debug Mode Setup

### Enable Debug Logging

1. **Backend Debug Mode**
   ```env
   # In .env file
   NODE_ENV=development
   DEBUG=whatsai:qr,whatsai:evolution,whatsai:instance
   LOG_LEVEL=debug
   ```

2. **Frontend Debug Mode**
   ```javascript
   // In browser console
   localStorage.setItem('debug', 'whatsai:*');
   ```

### Monitor QR Code Events

```javascript
// WebSocket debugging
const socket = io('http://localhost:3001');

socket.on('connect', () => {
  console.log('✅ WebSocket connected');
});

socket.on('qr_code', (data) => {
  console.log('📱 QR Code received:', {
    instanceId: data.instanceId,
    timestamp: data.timestamp,
    hasQrCode: !!data.base64,
    qrCodeLength: data.base64?.length
  });
});

socket.on('status_changed', (data) => {
  console.log('🔄 Status changed:', data);
});

socket.on('evolution_event', (event) => {
  console.log('📡 Evolution event:', event);
});
```

---

## ⚡ Quick Fixes

### 1. Complete Instance Reset
```bash
# Get instance ID
INSTANCE_ID="your_instance_id"
TOKEN="your_jwt_token"

# Disconnect
curl -X POST "http://localhost:3001/api/instances/$INSTANCE_ID/disconnect" \
  -H "Authorization: Bearer $TOKEN"

# Wait 5 seconds
sleep 5

# Connect
curl -X POST "http://localhost:3001/api/instances/$INSTANCE_ID/connect" \
  -H "Authorization: Bearer $TOKEN"

# Force QR update
curl -X POST "http://localhost:3001/api/instances/$INSTANCE_ID/force-qr-update" \
  -H "Authorization: Bearer $TOKEN"
```

### 2. Evolution API Instance Restart
```bash
# Restart specific instance in Evolution API
curl -X POST "http://your-evolution-api:8080/instance/restart/whatsai_INSTANCE_NAME" \
  -H "apikey: your-api-key"
```

### 3. Clear All and Start Fresh
```bash
# Delete instance
curl -X DELETE "http://localhost:3001/api/instances/$INSTANCE_ID" \
  -H "Authorization: Bearer $TOKEN"

# Create new instance
curl -X POST "http://localhost:3001/api/instances" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Fresh Instance"}'
```

---

## 📊 QR Code Status Flow

```
PENDING → CONNECTING → CONNECTED
   ↓           ↓           ↓
 No QR    QR Generated   No QR Needed
           ↓ (30s)
       QR Refreshed
```

### Status Meanings:

- **PENDING**: Instance not yet created in Evolution API
- **CONNECTING**: Waiting for WhatsApp scan (QR code active)
- **CONNECTED**: WhatsApp successfully connected
- **DISCONNECTED**: Connection lost or manually disconnected
- **ERROR**: Something went wrong

---

## 🛠️ Tools & Commands

### Evolution API Health Check
```bash
#!/bin/bash
# save as check_evolution.sh

EVOLUTION_URL="http://your-evolution-api:8080"
API_KEY="your-api-key"

echo "🔍 Checking Evolution API health..."

# Check if server is running
if curl -f -s "$EVOLUTION_URL" > /dev/null; then
    echo "✅ Evolution API server is running"
else
    echo "❌ Evolution API server is not accessible"
    exit 1
fi

# Check API key
RESPONSE=$(curl -s -w "%{http_code}" -X GET "$EVOLUTION_URL/instance/fetchInstances" \
  -H "apikey: $API_KEY" -o /dev/null)

if [ "$RESPONSE" = "200" ]; then
    echo "✅ API key is valid"
else
    echo "❌ Invalid API key (HTTP $RESPONSE)"
    exit 1
fi

echo "✅ Evolution API is healthy"
```

### Instance Status Monitor
```bash
#!/bin/bash
# save as monitor_instance.sh

INSTANCE_ID="$1"
TOKEN="$2"

if [ -z "$INSTANCE_ID" ] || [ -z "$TOKEN" ]; then
    echo "Usage: $0 <instance_id> <jwt_token>"
    exit 1
fi

echo "🔍 Monitoring instance: $INSTANCE_ID"

while true; do
    RESPONSE=$(curl -s "http://localhost:3001/api/instances/$INSTANCE_ID" \
      -H "Authorization: Bearer $TOKEN")
    
    STATUS=$(echo "$RESPONSE" | jq -r '.data.status')
    CONNECTED=$(echo "$RESPONSE" | jq -r '.data.connected')
    HAS_QR=$(echo "$RESPONSE" | jq -r '.data.qrCode != null')
    
    echo "[$(date)] Status: $STATUS | Connected: $CONNECTED | Has QR: $HAS_QR"
    
    sleep 5
done
```

---

## 📞 Support Checklist

When reporting QR code issues, please provide:

- [ ] Instance ID
- [ ] Current instance status
- [ ] Evolution API URL and version
- [ ] Error messages from browser console
- [ ] Network connectivity test results
- [ ] Steps to reproduce the issue
- [ ] Screenshots of the problem

### Collect Debug Information
```bash
# Run this and provide the output
echo "=== WhatsAI Debug Information ==="
echo "Date: $(date)"
echo "Node.js version: $(node --version)"
echo "NPM version: $(npm --version)"
echo ""

echo "=== Environment ==="
echo "NODE_ENV: $NODE_ENV"
echo "PORT: $PORT"
echo "EVOLUTION_API_URL: $EVOLUTION_API_URL"
echo ""

echo "=== Instance Status ==="
curl -s "http://localhost:3001/api/instances" \
  -H "Authorization: Bearer $TOKEN" | jq .

echo ""
echo "=== Evolution API Test ==="
curl -s -I "$EVOLUTION_API_URL/instance/fetchInstances" \
  -H "apikey: $EVOLUTION_API_KEY"
```

---

This troubleshooting guide should help resolve most QR code related issues. For persistent problems, check the GitHub issues or contact support with the debug information.