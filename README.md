# 🚀 WhatsAI Multi-Instance Manager

[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A powerful multi-instance WhatsApp manager built with TypeScript, Node.js, and Evolution API integration. Manage multiple WhatsApp connections simultaneously with real-time WebSocket updates and comprehensive API endpoints.

## ✨ Features

- 📱 **Multi-Instance Management**: Create and manage multiple WhatsApp instances
- 🔄 **Real-time Updates**: WebSocket integration for live status updates
- 📧 **Message Sending**: Send text messages through multiple instances
- 🔗 **Evolution API Integration**: Seamless integration with Evolution API
- 📊 **QR Code Generation**: Dynamic QR code generation for WhatsApp connection
- 🛡️ **TypeScript Safety**: Full TypeScript implementation with strict typing
- 🧪 **Testing Ready**: Jest testing framework configured
- 🐳 **Docker Support**: Full Docker configuration for easy deployment
- 💾 **Prisma ORM**: Type-safe database access with SQLite/PostgreSQL support

## 🏗️ Architecture

```
src/
├── core/           # Core application logic
├── api/            # API routes and controllers
├── services/       # Business logic and external integrations
├── types/          # TypeScript type definitions
└── config/         # Configuration and environment setup
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Evolution API server running (optional, can be configured)

### Installation

1. **Clone and setup**
   ```bash
   git clone <repository-url>
   cd WhatsAI2
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Open Test Client**
   Visit `http://localhost:3001/test` for the interactive test interface

## 🔧 Configuration

### Environment Variables

```env
# Application
NODE_ENV=development
PORT=3001

# Evolution API
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=your-evolution-api-key

# Security
JWT_SECRET=your-super-secret-jwt-key
```

### Evolution API Setup

The application integrates with [Evolution API](https://github.com/EvolutionAPI/evolution-api). 

#### 🔗 **Single Server Setup**
```env
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=your-evolution-api-key
```

#### 🌐 **Multiple Servers Setup** (Load Balancing)
```env
# Primary server
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=your-api-key-1

# Secondary servers (optional)
EVOLUTION_API_URL_2=http://localhost:8081
EVOLUTION_API_KEY_2=your-api-key-2
EVOLUTION_API_URL_3=http://localhost:8082
EVOLUTION_API_KEY_3=your-api-key-3
```

This allows distributing WhatsApp instances across multiple Evolution API servers for better performance and reliability.

## 📡 API Endpoints

### Health Check
```http
GET /health
```

### Instance Management
```http
# Create new instance
POST /api/instances
{
  "name": "My Instance",
  "webhook": "https://your-webhook-url.com" (optional)
}

# List all instances
GET /api/instances

# Get specific instance
GET /api/instances/:instanceId

# Delete instance
DELETE /api/instances/:instanceId

# Connect instance
POST /api/instances/:instanceId/connect

# Disconnect instance
POST /api/instances/:instanceId/disconnect

# Get QR Code
GET /api/instances/:instanceId/qr

# Send message
POST /api/instances/:instanceId/send-message
{
  "number": "+5511999999999",
  "text": "Hello from WhatsAI!"
}
```

### Webhooks
```http
# Evolution API webhooks
POST /api/webhooks/evolution/:instanceId
POST /api/webhooks/message/:instanceId
POST /api/webhooks/status/:instanceId
```

## 🌐 WebSocket Events

### Client → Server
- `join_instance`: Join instance-specific room
- `leave_instance`: Leave instance room

### Server → Client
- `instance_created`: New instance created
- `instance_deleted`: Instance deleted
- `qr_code`: QR code generated
- `status_changed`: Instance status update
- `message_received`: New message received
- `evolution_event`: Evolution API events

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 🏗️ Build and Deploy

```bash
# Build for production
npm run build

# Start production server
npm start

# Using Docker
docker build -t whatsai-manager .
docker run -p 3001:3001 whatsai-manager
```

## 📱 Test Client

The application includes a comprehensive test client accessible at `/test`. Features include:

- 📱 **Instance Creation**: Create new WhatsApp instances
- 🔗 **Connection Management**: Connect/disconnect instances
- 📧 **Message Testing**: Send test messages
- 📊 **QR Code Display**: View QR codes for scanning
- 🔄 **Real-time Updates**: Live status updates via WebSocket

## 🛠️ Development

### Project Structure

```
├── src/
│   ├── core/
│   │   └── app.ts                 # Main application class
│   ├── api/
│   │   ├── controllers/           # API controllers
│   │   └── routes/               # Route definitions
│   ├── services/
│   │   ├── evolution-api.ts      # Evolution API integration
│   │   ├── instance-service.ts   # Instance management
│   │   └── socket-service.ts     # WebSocket handling
│   ├── types/
│   │   └── index.ts              # TypeScript definitions
│   ├── config/
│   │   └── env.ts                # Environment configuration
│   └── server.ts                 # Application entry point
├── test-client.html              # Test interface
├── package.json                  # Dependencies and scripts
├── tsconfig.json                # TypeScript configuration
├── jest.config.ts               # Testing configuration
└── docker-compose.yml           # Docker setup
```

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start           # Start production server
npm test            # Run tests
npm run test:watch  # Run tests in watch mode
npm run lint        # Run ESLint
npm run type-check  # TypeScript type checking
```

## 🔗 Integration Examples

### Basic Instance Creation

```javascript
// Create a new WhatsApp instance
const response = await fetch('/api/instances', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Customer Service Bot',
    webhook: 'https://myapp.com/webhook'
  })
});

const instance = await response.json();
console.log('Instance created:', instance.data.id);
```

### WebSocket Integration

```javascript
// Connect to WebSocket
const socket = io('http://localhost:3001');

// Join instance room
socket.emit('join_instance', instanceId);

// Listen for QR codes
socket.on('qr_code', (data) => {
  console.log('QR Code:', data.base64);
  // Display QR code to user
});

// Listen for status changes
socket.on('status_changed', (data) => {
  console.log(`Instance ${data.instanceId} is now ${data.status}`);
});
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📖 **Documentation**: Check this README and inline code comments
- 🐛 **Issues**: Report bugs via GitHub Issues
- 💬 **Discussions**: Use GitHub Discussions for questions

## 🔮 Roadmap

- [ ] Database persistence (Prisma + PostgreSQL)
- [ ] User authentication and authorization
- [ ] Message templates and automation
- [ ] Analytics and reporting dashboard
- [ ] Bulk message sending
- [ ] File and media message support
- [ ] Advanced webhook management
- [ ] Multi-language support

---

Built with ❤️ for efficient WhatsApp management