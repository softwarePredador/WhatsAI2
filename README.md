# 🚀 WhatsAI Multi-Instance Manager

[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A powerful multi-instance WhatsApp manager built with TypeScript, Node.js, and Evolution API integration. Manage multiple WhatsApp connections simultaneously with real-time WebSocket updates, user authentication, settings persistence, and comprehensive API endpoints.

## ✨ Features

### 🏢 **Core Features**
- 📱 **Multi-Instance Management**: Create and manage multiple WhatsApp instances
- 🔄 **Real-time Updates**: WebSocket integration for live status updates
- 📧 **Message Sending**: Send text messages through multiple instances
- 🔗 **Evolution API Integration**: Seamless integration with Evolution API
- 📊 **QR Code Generation**: Dynamic QR code generation with automatic refresh
- ✅ **Smart WhatsApp Verification**: Automatically checks if numbers have WhatsApp before sending
- 💬 **Complete Chat Interface**: WhatsApp-like chat interface with conversation management

### 🔐 **Authentication & Security**
- 🛡️ **User Authentication**: JWT-based authentication system
- 👤 **User Registration**: Secure user registration and login
- 🔑 **Password Management**: Secure password handling with bcrypt
- 🚫 **Account Deletion**: Secure account deletion with confirmation

### ⚙️ **User Settings & Personalization**
- 🎨 **Theme Management**: Light, dark, and auto theme modes
- 🌍 **Multi-language Support**: Customizable language settings
- 🔔 **Notification Controls**: Email, push, and sound notification settings
- 🔄 **Auto-refresh Settings**: Configurable refresh intervals
- 👤 **Profile Management**: User profile customization

### 🧪 **Testing & Quality Assurance**
- 🧪 **Comprehensive Test Suite**: Automated tests for frontend configuration validation
- 🔄 **CI/CD Pipeline**: GitHub Actions for automated testing and deployment
- 🪝 **Pre-commit Hooks**: Husky pre-commit hooks to prevent configuration regressions
- ✅ **Connectivity Testing**: Automated tests to prevent ERR_CONNECTION_REFUSED issues
- � **Configuration Validation**: Tests ensure Vite proxy and WebSocket configurations remain correct

## 🏗️ Architecture

```
WhatsAI2/
├── client/                    # React Frontend
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── features/         # Feature modules
│   │   ├── hooks/           # Custom React hooks
│   │   ├── pages/           # Page components
│   │   └── styles/          # CSS styles
│   └── package.json
├── server/                   # Node.js Backend
│   ├── src/
│   │   ├── api/             # API routes and controllers
│   │   ├── services/        # Business logic
│   │   ├── database/        # Prisma setup and repositories
│   │   ├── types/           # TypeScript definitions
│   │   └── config/          # Configuration
│   ├── prisma/              # Database schema and migrations
│   └── package.json
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Evolution API server running
- ngrok (optional, for webhooks): `brew install ngrok` (Mac) or `choco install ngrok` (Windows)

### Quick Start (Cross-Platform)

#### Mac/Linux
```bash
# One-command setup and start
./start-mac.sh

# Or manually
npm run install:all
cd server && cp .env.example .env
# Edit .env with your credentials
cd .. && npm run dev
```

#### Windows
```batch
REM One-command setup and start
start-windows.bat

REM Or manually
npm run install:all
cd server && copy .env.example .env
REM Edit .env with your credentials
cd .. && npm run dev
```

### Manual Installation

1. **Clone and setup**
   ```bash
   git clone <repository-url>
   cd WhatsAI2
   
   # Install all dependencies (backend + frontend)
   npm run install:all
   ```

2. **Environment Configuration**
   ```bash
   # Backend configuration
   cd server
   cp .env.example .env  # Mac/Linux
   # OR
   copy .env.example .env  # Windows
   
   # Edit .env with your settings
   nano .env  # Mac/Linux
   # OR
   notepad .env  # Windows
   ```

3. **Database Setup**
   ```bash
   cd server
   npx prisma generate
   npx prisma db push
   ```

4. **Start Development Servers**
   ```bash
   # 🚀 Quick start (all platforms)
   npm run dev
   # This starts: Backend (3001) + Frontend (3000) + ngrok tunnel

   # Without ngrok (local only)
   npm run dev:no-tunnel
   
   # Or individual services
   npm run dev:server   # Backend only
   npm run dev:client   # Frontend only
   npm run tunnel       # Ngrok only
   ```

5. **Access Applications**
   - **Frontend App**: `http://localhost:3000`
   - **Backend API**: `http://localhost:3001`
   - **Health Check**: `http://localhost:3001/health`
   - **Ngrok URL**: Check terminal output for public URL

6. **Project Management (Cross-Platform)**
   ```bash
   # Check and clean ports (works on Windows/Mac/Linux)
   npm run kill:ports

   # Kill all services and clean
   npm run clean

   # Reinstall everything
   npm run install:all

   # Build for production
   npm run build
   
   # Start production server
   npm start
   ```

## 🔧 Configuration

### Port Configuration
```
Frontend (Vite):     Port 3000
Backend (Express):   Port 3001
WebSocket:           Port 3001
```

### 🚀 Development with External Access (ngrok)

For webhook testing and external access, use the integrated ngrok tunnel:

#### First Time Setup (ngrok)
```bash
# Mac/Linux
brew install ngrok

# Windows
choco install ngrok

# Configure your authtoken (get from https://dashboard.ngrok.com)
ngrok config add-authtoken YOUR_AUTHTOKEN_HERE
```

#### Using ngrok with the project
```bash
# Start everything with ngrok tunnel
npm run dev

# Or start without ngrok (local development only)
npm run dev:no-tunnel

# Or start ngrok separately
npm run tunnel
```

**What happens with `npm run dev`:**
1. ✅ Cleans ports 3000 and 3001
2. 🚀 Starts backend server (Port 3001)
3. 🎨 Starts frontend (Port 3000)
4. 🌐 Starts ngrok tunnel to backend (Port 3001)
5. 📊 Shows status of all services

**Access URLs:**
- **Frontend**: `http://localhost:3000` (local only)
- **Backend API**: `http://localhost:3001` (local)
- **Backend API (public)**: `https://xxxxx.ngrok-free.app` (check terminal for URL)
- **Webhooks**: Configure Evolution API to send to `https://xxxxx.ngrok-free.app/api/webhooks/evolution/{instanceName}`

**Important:** The ngrok URL changes every time you restart unless you have a paid plan.

### Environment Variables

```env
# Backend (.env)
NODE_ENV=development
PORT=3001

# Database
DATABASE_URL="file:./dev.db"

# Evolution API
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=your-evolution-api-key

# Security
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Default Admin User
DEFAULT_ADMIN_EMAIL=admin@whatsai.com
DEFAULT_ADMIN_PASSWORD=admin123
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
```

## 📡 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/logout` | User logout |
| PUT | `/api/auth/change-password` | Change password |
| GET | `/api/auth/me` | Get current user info |

### Instance Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/instances` | Create new instance | ✅ |
| GET | `/api/instances` | List all instances | ✅ |
| GET | `/api/instances/:id` | Get specific instance | ✅ |
| PUT | `/api/instances/:id` | Update instance | ✅ |
| DELETE | `/api/instances/:id` | Delete instance | ✅ |
| POST | `/api/instances/:id/connect` | Connect instance | ✅ |
| POST | `/api/instances/:id/disconnect` | Disconnect instance | ✅ |
| GET | `/api/instances/:id/qr` | Get QR Code | ✅ |
| POST | `/api/instances/:id/send-message` | Send message | ✅ |
| POST | `/api/instances/:id/force-qr-update` | Force QR update | ✅ |

### User Settings

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/settings` | Get user settings | ✅ |
| PUT | `/api/settings` | Update user settings | ✅ |
| POST | `/api/settings/reset` | Reset to defaults | ✅ |
| GET | `/api/settings/theme` | Get theme setting | ✅ |
| GET | `/api/settings/auto-refresh` | Get auto-refresh settings | ✅ |

### Account Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/account/deletion/preview` | Preview account deletion | ✅ |
| DELETE | `/api/account/deletion` | Delete account permanently | ✅ |

### System Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/health` | Health check | ❌ |
| POST | `/api/webhooks/evolution/:instanceId` | Evolution API webhooks | ❌ |

## 🔧 Request/Response Examples

### User Registration
```javascript
// Request
POST /api/auth/register
{
  "name": "John Doe",
  "email": "john@example.com", 
  "password": "secure123"
}

// Response
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "USER"
    },
    "token": "jwt_token_here"
  }
}
```

### Create Instance
```javascript
// Request
POST /api/instances
Authorization: Bearer jwt_token
{
  "name": "Customer Service",
  "webhook": "https://myapp.com/webhook"
}

// Response
{
  "success": true,
  "data": {
    "instance": {
      "id": "instance_id",
      "name": "Customer Service",
      "status": "PENDING",
      "qrCode": "data:image/png;base64,..."
    }
  }
}
```

### Update Settings
```javascript
// Request
PUT /api/settings
Authorization: Bearer jwt_token
{
  "theme": "dark",
  "displayName": "John Doe",
  "autoRefresh": true,
  "autoRefreshInterval": 60
}

// Response
{
  "success": true,
  "data": {
    "settings": {
      "theme": "dark",
      "displayName": "John Doe",
      "autoRefresh": true,
      "autoRefreshInterval": 60,
      // ... other settings
    }
  }
}
```

### Account Deletion Preview
```javascript
// Request
GET /api/account/deletion/preview
Authorization: Bearer jwt_token

// Response
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
  }
}
```

### Account Deletion
```javascript
// Request
DELETE /api/account/deletion
Authorization: Bearer jwt_token
{
  "password": "user_password",
  "confirmEmail": "john@example.com",
  "confirmDeletion": true
}

// Response
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
  }
}
```

## 🌐 WebSocket Events

### Client → Server
- `join_instance`: Join instance-specific room
- `leave_instance`: Leave instance room

### Server → Client
- `instance_created`: New instance created
- `instance_deleted`: Instance deleted
- `qr_code`: QR code generated/updated
- `status_changed`: Instance status update
- `message_received`: New message received
- `evolution_event`: Evolution API events

## 🧪 Testing

```bash
# Backend tests
cd server
npm test
npm run test:coverage
npm run test:watch

# Frontend tests
cd client
npm test
npm run test:coverage

# Run all tests (monorepo)
npm run test          # Run all tests
npm run test:client   # Run only client tests
npm run test:server   # Run only server tests
npm run test:watch    # Run tests in watch mode
```

### 🛡️ Preventive Testing Infrastructure

This project includes comprehensive automated tests to prevent configuration regressions that could cause connectivity issues:

#### Frontend Configuration Tests
- **socketService.test.ts**: Validates WebSocket connections use relative URLs for Vite proxy compatibility
- **instanceService.test.ts**: Ensures API services are configured for proxy-based communication
- **vite.config.test.ts**: Verifies Vite proxy configuration remains correct

#### CI/CD Integration
- **GitHub Actions**: Automated testing on every push and pull request
- **Pre-commit Hooks**: Husky prevents commits that break configuration
- **Multi-environment Testing**: Tests run on Node.js 18.x and 20.x

#### Preventing ERR_CONNECTION_REFUSED Issues
The test suite specifically prevents the connectivity issues you experienced by:
- Validating that WebSocket connections use `/socket.io` instead of direct backend URLs
- Ensuring API calls use relative paths that work with Vite's proxy configuration
- Monitoring Vite proxy settings to prevent misconfigurations

```bash
# Run preventive tests
npm run test:client  # Validates frontend connectivity configuration
```

## 🏗️ Build and Deploy

### Development
```bash
# Backend
cd server && npm run dev

# Frontend  
cd client && npm run dev
```

### Production
```bash
# Build backend
cd server && npm run build

# Build frontend
cd client && npm run build

# Start production
cd server && npm start
```

### Docker Deployment
```bash
# Backend
cd server
docker build -t whatsai-backend .
docker run -p 3001:3001 whatsai-backend

# Full stack with docker-compose
docker-compose up -d
```

## � QR Code Troubleshooting

### Common QR Code Issues

1. **QR Code Not Appearing**
   ```bash
   # Check Evolution API connection
   curl -X GET "your-evolution-api-url/instance/connectionState/instance_name" \
     -H "apikey: your-api-key"
   
   # Force QR code refresh
   POST /api/instances/:id/force-qr-update
   ```

2. **QR Code Expired**
   - QR codes auto-refresh every 30 seconds when status is 'connecting'
   - Use the force update endpoint for manual refresh
   - Check that Evolution API server is running and accessible

3. **Instance Not Connecting**
   ```bash
   # Check instance status
   GET /api/instances/:id
   
   # Restart instance connection
   POST /api/instances/:id/disconnect
   POST /api/instances/:id/connect
   ```

### Debug Logging

Enable debug mode to see detailed QR code operations:

```env
NODE_ENV=development
DEBUG=whatsai:qr,whatsai:evolution
```

## 🛠️ Development

### Database Schema

```sql
-- Users table
model User {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique  
  password  String   // bcrypt hash
  role      String   @default("USER")
  active    Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  instances WhatsAppInstance[]
  settings  UserSettings?
}

-- User Settings table
model UserSettings {
  id                    String  @id @default(cuid())
  userId                String  @unique
  displayName           String?
  profilePicture        String?
  bio                   String?
  theme                 String  @default("light")
  language              String  @default("pt-BR")
  emailNotifications    Boolean @default(true)
  pushNotifications     Boolean @default(true)
  soundNotifications    Boolean @default(true)
  notificationFrequency String  @default("immediate")
  autoRefresh           Boolean @default(true)
  autoRefreshInterval   Int     @default(30)
  showOnlineStatus      Boolean @default(true)
  allowDataCollection   Boolean @default(false)
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

-- WhatsApp Instances table  
model WhatsAppInstance {
  id                    String    @id @default(cuid())
  name                  String
  evolutionInstanceName String    @unique
  status                String    @default("PENDING")
  connected             Boolean   @default(false)
  evolutionApiUrl       String
  evolutionApiKey       String
  webhook               String?
  qrCode                String?
  lastSeen              DateTime?
  connectedAt           DateTime?
  userId                String
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  user     User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  messages Message[]
}
```

### Project Structure

```
server/src/
├── api/
│   ├── controllers/
│   │   ├── auth/              # Authentication controllers
│   │   ├── instances/         # Instance management
│   │   ├── settings/          # User settings
│   │   └── account/           # Account management
│   ├── middlewares/           # Express middlewares
│   └── routes/                # API route definitions
├── core/
│   └── app.ts                 # Main application class
├── database/
│   ├── prisma.ts              # Prisma client setup
│   └── repositories/          # Data access layer
├── services/
│   ├── auth-service.ts        # Authentication logic
│   ├── evolution-api.ts       # Evolution API integration
│   ├── instance-service.ts    # Instance management
│   ├── user-settings-service.ts # Settings management
│   ├── account-deletion-service.ts # Account deletion
│   └── socket-service.ts      # WebSocket handling
├── types/
│   └── index.ts               # TypeScript definitions
├── config/
│   └── env.ts                 # Environment configuration
└── server.ts                  # Application entry point

client/src/
├── components/
│   ├── Header.tsx             # App header
│   ├── Navbar.tsx             # Navigation
│   ├── Footer.tsx             # App footer
│   ├── Logo.tsx               # Logo component
│   ├── UserMenu.tsx           # User menu dropdown
│   └── ProtectedRoute.tsx     # Route protection
├── features/
│   ├── auth/                  # Authentication features
│   └── instances/             # Instance management UI
├── hooks/
│   ├── useLocalStorage.ts     # Local storage hook
│   ├── useTheme.ts            # Theme management
│   └── useNotifications.ts    # Notification handling
├── pages/
│   ├── LoginPage.tsx          # Login page
│   ├── HomePage.tsx           # Main dashboard
│   ├── SettingsPage.tsx       # Settings interface
│   └── ProfilePage.tsx        # User profile
├── styles/
│   └── index.css              # Global styles
└── types/
    └── settings.ts            # Settings types
```

### Available Scripts

```bash
# Backend
npm run dev          # Start development server
npm run build        # Build for production  
npm start           # Start production server
npm test            # Run tests
npm run test:watch  # Run tests in watch mode
npm run lint        # Run ESLint
npm run type-check  # TypeScript type checking

# Database
npx prisma generate  # Generate Prisma client
npx prisma db push   # Push schema changes
npx prisma studio    # Open Prisma Studio

# Frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm test            # Run tests
npm run lint        # Run ESLint
```

## 🔗 Integration Examples

### Frontend Authentication Integration

```typescript
// Login function
const login = async (email: string, password: string) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  const result = await response.json();
  if (result.success) {
    localStorage.setItem('token', result.data.token);
    localStorage.setItem('user', JSON.stringify(result.data.user));
  }
  return result;
};

// Protected API call
const createInstance = async (instanceData) => {
  const token = localStorage.getItem('token');
  const response = await fetch('/api/instances', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(instanceData)
  });
  return response.json();
};
```

### Settings Management

```typescript
// Update user settings
const updateSettings = async (settings: Partial<UserSettings>) => {
  const token = localStorage.getItem('token');
  const response = await fetch('/api/settings', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(settings)
  });
  return response.json();
};

// Get theme setting
const getTheme = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch('/api/settings/theme', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};
```

### WebSocket Integration

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001');

// Join instance room for updates
socket.emit('join_instance', instanceId);

// Listen for QR codes
socket.on('qr_code', (data) => {
  console.log('QR Code updated:', data.base64);
  updateQRCodeDisplay(data.base64);
});

// Listen for status changes
socket.on('status_changed', (data) => {
  console.log(`Instance ${data.instanceId} status: ${data.status}`);
  updateInstanceStatus(data.instanceId, data.status);
});

// Listen for new messages
socket.on('message_received', (message) => {
  console.log('New message:', message);
  addMessageToUI(message);
});
```

## 🔐 Security Features

### Authentication
- JWT-based authentication with configurable expiration
- Secure password hashing with bcrypt
- Protected routes with middleware validation
- User role management (USER, ADMIN)

### Account Security
- Password change functionality with current password verification
- Secure account deletion with double confirmation (password + email)
- Session management and token validation

### Data Protection
- Input validation with Zod schemas
- SQL injection prevention with Prisma ORM
- XSS protection with proper response headers
- Environment variable management for sensitive data

### API Security
- Rate limiting (implementable with express-rate-limit)
- CORS configuration
- Request validation middleware
- Error handling without information disclosure

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write tests for new features
- Update documentation for API changes
- Use conventional commit messages
- Ensure all tests pass before submitting PR

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📖 **Documentation**: Check this README and inline code comments
- 🐛 **Issues**: Report bugs via GitHub Issues
- 💬 **Discussions**: Use GitHub Discussions for questions
- 📧 **Email**: Contact for enterprise support

## ✅ Completed Features

- [x] ✅ **Multi-Instance WhatsApp Management**
- [x] ✅ **Real-time QR Code Generation & Auto-refresh**
- [x] ✅ **User Authentication System (JWT)**
- [x] ✅ **User Registration & Login**
- [x] ✅ **Comprehensive Settings Management**
- [x] ✅ **Theme Management (Light/Dark/Auto)**
- [x] ✅ **Profile Customization**
- [x] ✅ **Notification Settings**
- [x] ✅ **Auto-refresh Configuration**
- [x] ✅ **Secure Account Deletion**
- [x] ✅ **Database Persistence (Prisma + SQLite)**
- [x] ✅ **WebSocket Real-time Updates**
- [x] ✅ **Evolution API Integration**
- [x] ✅ **Message Sending**
- [x] ✅ **Instance Status Monitoring**
- [x] ✅ **Comprehensive API Documentation**
- [x] ✅ **Frontend React Application**
- [x] ✅ **TypeScript Implementation**
- [x] ✅ **Docker Support**
- [x] ✅ **Testing Framework Setup**

## 🔮 Future Enhancements

- [ ] Analytics and reporting dashboard
- [ ] Bulk message sending
- [ ] File and media message support
- [ ] Message templates and automation
- [ ] Advanced webhook management
- [ ] Multi-language UI support
- [ ] Mobile app (React Native)
- [ ] Advanced user roles and permissions
- [ ] API rate limiting and monitoring
- [ ] Database backup and restore

---

Built with ❤️ for efficient WhatsApp management