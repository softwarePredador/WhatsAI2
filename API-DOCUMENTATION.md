# 📚 WhatsAI API Documentation

## 🔗 Base URL
```
http://localhost:3001/api
```

## 🔐 Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```http
Authorization: Bearer your_jwt_token_here
```

### Getting a Token

1. **Register** a new user or **Login** with existing credentials
2. The response will include a `token` field
3. Use this token for subsequent authenticated requests

---

## 🛡️ Authentication Endpoints

### Register New User
```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secure123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "USER",
      "active": true,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### User Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "secure123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "USER"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Get Current User
```http
GET /auth/me
Authorization: Bearer jwt_token
```

### Change Password
```http
PUT /auth/change-password
Authorization: Bearer jwt_token
Content-Type: application/json

{
  "currentPassword": "old_password",
  "newPassword": "new_secure_password"
}
```

### Logout
```http
POST /auth/logout
Authorization: Bearer jwt_token
```

---

## 📱 Instance Management Endpoints

### Create New Instance
```http
POST /instances
Authorization: Bearer jwt_token
Content-Type: application/json

{
  "name": "Customer Service Bot",
  "webhook": "https://myapp.com/webhook"  // optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "instance": {
      "id": "instance_id",
      "name": "Customer Service Bot",
      "evolutionInstanceName": "whatsai_unique_id",
      "status": "PENDING",
      "connected": false,
      "webhook": "https://myapp.com/webhook",
      "qrCode": null,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  },
  "message": "Instance created successfully"
}
```

### List All User Instances
```http
GET /instances
Authorization: Bearer jwt_token
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "instance_id",
      "name": "Customer Service Bot",
      "status": "CONNECTED",
      "connected": true,
      "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
      "lastSeen": "2025-01-01T00:00:00.000Z",
      "connectedAt": "2025-01-01T00:00:00.000Z",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "message": "Instances retrieved successfully"
}
```

### Get Specific Instance
```http
GET /instances/:instanceId
Authorization: Bearer jwt_token
```

### Update Instance
```http
PUT /instances/:instanceId
Authorization: Bearer jwt_token
Content-Type: application/json

{
  "name": "Updated Instance Name",
  "webhook": "https://new-webhook.com/endpoint"
}
```

### Delete Instance
```http
DELETE /instances/:instanceId
Authorization: Bearer jwt_token
```

**Response:**
```json
{
  "success": true,
  "message": "Instance deleted successfully"
}
```

### Connect Instance
```http
POST /instances/:instanceId/connect
Authorization: Bearer jwt_token
```

**Response:**
```json
{
  "success": true,
  "data": {
    "instance": {
      "id": "instance_id",
      "status": "CONNECTING",
      "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
    }
  },
  "message": "Instance connection initiated"
}
```

### Disconnect Instance
```http
POST /instances/:instanceId/disconnect
Authorization: Bearer jwt_token
```

### Get QR Code
```http
GET /instances/:instanceId/qr
Authorization: Bearer jwt_token
```

**Response:**
```json
{
  "success": true,
  "data": {
    "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "status": "CONNECTING"
  },
  "message": "QR code retrieved successfully"
}
```

### Force QR Code Update
```http
POST /instances/:instanceId/force-qr-update
Authorization: Bearer jwt_token
```

### Send Message
```http
POST /instances/:instanceId/send-message
Authorization: Bearer jwt_token
Content-Type: application/json

{
  "number": "+5511999999999",
  "text": "Hello from WhatsAI!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "messageId": "message_id",
    "status": "sent"
  },
  "message": "Message sent successfully"
}
```

---

## ⚙️ User Settings Endpoints

### Get User Settings
```http
GET /settings
Authorization: Bearer jwt_token
```

**Response:**
```json
{
  "success": true,
  "data": {
    "settings": {
      "id": "settings_id",
      "userId": "user_id",
      "displayName": "John Doe",
      "profilePicture": null,
      "bio": null,
      "theme": "dark",
      "language": "pt-BR",
      "emailNotifications": true,
      "pushNotifications": true,
      "soundNotifications": false,
      "notificationFrequency": "immediate",
      "autoRefresh": true,
      "autoRefreshInterval": 60,
      "showOnlineStatus": true,
      "allowDataCollection": false,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  },
  "message": "User settings retrieved successfully"
}
```

### Update User Settings
```http
PUT /settings
Authorization: Bearer jwt_token
Content-Type: application/json

{
  "displayName": "John Doe Updated",
  "theme": "dark",
  "language": "en-US",
  "autoRefresh": false,
  "autoRefreshInterval": 120,
  "emailNotifications": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "settings": {
      // Updated settings object
    }
  },
  "message": "User settings updated successfully"
}
```

### Reset Settings to Defaults
```http
POST /settings/reset
Authorization: Bearer jwt_token
```

### Get Theme Setting
```http
GET /settings/theme
Authorization: Bearer jwt_token
```

**Response:**
```json
{
  "success": true,
  "data": {
    "theme": "dark"
  },
  "message": "User theme retrieved successfully"
}
```

### Get Auto-refresh Settings
```http
GET /settings/auto-refresh
Authorization: Bearer jwt_token
```

**Response:**
```json
{
  "success": true,
  "data": {
    "enabled": true,
    "interval": 60
  },
  "message": "Auto-refresh settings retrieved successfully"
}
```

---

## 🗑️ Account Management Endpoints

### Preview Account Deletion
```http
GET /account/deletion/preview
Authorization: Bearer jwt_token
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "email": "john@example.com",
      "name": "John Doe",
      "createdAt": "2025-01-01T00:00:00.000Z"
    },
    "dataToDelete": {
      "instances": 3,
      "messages": 1250,
      "settings": true
    }
  },
  "message": "Account deletion preview retrieved successfully"
}
```

### Delete Account Permanently
```http
DELETE /account/deletion
Authorization: Bearer jwt_token
Content-Type: application/json

{
  "password": "user_current_password",
  "confirmEmail": "john@example.com",
  "confirmDeletion": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "deletedData": {
      "userId": "user_id",
      "email": "john@example.com",
      "instancesDeleted": 3,
      "messagesDeleted": 1250,
      "settingsDeleted": true
    }
  },
  "message": "Account deleted successfully. All associated data has been permanently removed."
}
```

---

## 🌐 System Endpoints

### Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "service": "WhatsAI Multi-Instance Manager",
  "version": "1.0.0"
}
```

---

## 🔌 Webhook Endpoints

### Evolution API Webhooks
```http
POST /webhooks/evolution/:instanceId
Content-Type: application/json

# This endpoint receives webhooks from Evolution API
# Automatically processes QR codes, status changes, and messages
```

---

## 📊 Response Formats

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error type",
  "message": "Detailed error message",
  "details": [
    // Validation errors (if applicable)
  ]
}
```

---

## 🚨 Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (invalid/missing token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 409 | Conflict (duplicate resource) |
| 500 | Internal Server Error |

---

## 🔍 Error Examples

### Validation Error
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "code": "too_small",
      "minimum": 6,
      "type": "string",
      "inclusive": true,
      "exact": false,
      "message": "Password must be at least 6 characters",
      "path": ["password"]
    }
  ]
}
```

### Authentication Error
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
```

### Resource Not Found
```json
{
  "success": false,
  "error": "Instance not found",
  "message": "Instance with ID 'invalid_id' not found"
}
```

---

## 🔧 Rate Limiting

Currently, there are no rate limits implemented, but they can be added using middleware like `express-rate-limit`.

Recommended limits:
- Authentication endpoints: 5 requests per minute per IP
- Instance creation: 10 per hour per user
- Message sending: 100 per minute per instance
- General API: 1000 requests per hour per user

---

## 🧪 Testing with cURL

### Example Test Flow

1. **Register User**
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"test123"}'
```

2. **Login and Get Token**
```bash
TOKEN=$(curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}' \
  -s | jq -r '.data.token')
```

3. **Create Instance**
```bash
curl -X POST http://localhost:3001/api/instances \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Instance"}'
```

4. **Get QR Code**
```bash
curl -X GET http://localhost:3001/api/instances/INSTANCE_ID/qr \
  -H "Authorization: Bearer $TOKEN"
```

5. **Update Settings**
```bash
curl -X PUT http://localhost:3001/api/settings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"theme":"dark","autoRefresh":false}'
```

---

## 📱 WebSocket Events

Connect to: `ws://localhost:3001`

### Events You Can Emit
```javascript
// Join instance room for updates
socket.emit('join_instance', instanceId);

// Leave instance room
socket.emit('leave_instance', instanceId);
```

### Events You Can Listen For
```javascript
// QR code updates
socket.on('qr_code', (data) => {
  // data: { instanceId, base64, timestamp }
});

// Status changes
socket.on('status_changed', (data) => {
  // data: { instanceId, status, timestamp }
});

// New messages
socket.on('message_received', (message) => {
  // message: { instanceId, from, content, timestamp }
});

// Instance lifecycle
socket.on('instance_created', (instance) => {
  // instance: { id, name, status }
});

socket.on('instance_deleted', (data) => {
  // data: { instanceId }
});
```

---

This documentation covers all available endpoints and their usage. For more detailed examples and integration guides, refer to the main README.md file.