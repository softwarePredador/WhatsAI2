# 🚀 WhatsAI Deployment Guide

## 📋 Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Evolution API server running
- Database (SQLite for development, PostgreSQL for production)
- Domain name (for production)
- SSL certificate (for production)

---

## 🏗️ Development Deployment

### 1. Clone and Setup
```bash
git clone <repository-url>
cd WhatsAI2

# Install backend dependencies
cd server
npm install

# Install frontend dependencies  
cd ../client
npm install
```

### 2. Environment Configuration
```bash
# Backend environment
cd server
cp .env.example .env
```

Edit `server/.env`:
```env
NODE_ENV=development
PORT=3001

# Database
DATABASE_URL="file:./dev.db"

# Evolution API
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=your-evolution-api-key

# Security
JWT_SECRET=your-super-secret-jwt-key-here-min-32-chars
JWT_EXPIRES_IN=7d

# Default Admin
DEFAULT_ADMIN_EMAIL=admin@whatsai.com
DEFAULT_ADMIN_PASSWORD=admin123
```

### 3. Database Setup
```bash
cd server
npx prisma generate
npx prisma db push
```

### 4. Start Development Servers
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client  
npm run dev
```

### 5. Access Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Test Client: http://localhost:3001/test

---

## 🌐 Production Deployment

### Option 1: Manual Production Setup

#### 1. Server Preparation
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx for reverse proxy
sudo apt install nginx

# Install certbot for SSL
sudo apt install certbot python3-certbot-nginx
```

#### 2. Application Setup
```bash
# Clone repository
git clone <repository-url> /var/www/whatsai
cd /var/www/whatsai

# Set proper ownership
sudo chown -R $USER:$USER /var/www/whatsai

# Install dependencies
cd server && npm ci --production
cd ../client && npm ci --production

# Build frontend
npm run build
```

#### 3. Environment Configuration
```bash
# Production environment
cd /var/www/whatsai/server
cp .env.example .env
```

Edit production `.env`:
```env
NODE_ENV=production
PORT=3001

# Database (PostgreSQL recommended for production)
DATABASE_URL="postgresql://username:password@localhost:5432/whatsai_db"

# Evolution API
EVOLUTION_API_URL=https://your-evolution-api.com
EVOLUTION_API_KEY=your-production-api-key

# Security
JWT_SECRET=your-super-secure-production-jwt-secret-min-32-chars
JWT_EXPIRES_IN=7d

# Admin
DEFAULT_ADMIN_EMAIL=admin@yourdomain.com
DEFAULT_ADMIN_PASSWORD=change-this-in-production
```

#### 4. Database Setup (PostgreSQL)
```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
postgres=# CREATE DATABASE whatsai_db;
postgres=# CREATE USER whatsai_user WITH PASSWORD 'secure_password';
postgres=# GRANT ALL PRIVILEGES ON DATABASE whatsai_db TO whatsai_user;
postgres=# \q

# Run migrations
cd /var/www/whatsai/server
npx prisma generate
npx prisma db push
```

#### 5. Build and Start Application
```bash
# Build backend
cd /var/www/whatsai/server
npm run build

# Build frontend
cd ../client
npm run build

# Start with PM2
cd ../server
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

Create `server/ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'whatsai-backend',
    script: 'dist/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
};
```

#### 6. Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/whatsai
```

Add Nginx configuration:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend (static files)
    location / {
        root /var/www/whatsai/client/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/whatsai /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 7. SSL Setup
```bash
# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

---

### Option 2: Docker Deployment

#### 1. Create Docker Files

`server/Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build application
RUN npm run build

# Expose port
EXPOSE 3001

# Start application
CMD ["npm", "start"]
```

`client/Dockerfile`:
```dockerfile
FROM node:18-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built app
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

`client/nginx.conf`:
```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    server {
        listen 80;
        server_name localhost;

        location / {
            root /usr/share/nginx/html;
            try_files $uri $uri/ /index.html;
        }

        location /api {
            proxy_pass http://backend:3001;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /socket.io/ {
            proxy_pass http://backend:3001;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }
    }
}
```

`docker-compose.yml`:
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: whatsai_db
      POSTGRES_USER: whatsai_user
      POSTGRES_PASSWORD: secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./server
    restart: unless-stopped
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://whatsai_user:secure_password@postgres:5432/whatsai_db
      EVOLUTION_API_URL: ${EVOLUTION_API_URL}
      EVOLUTION_API_KEY: ${EVOLUTION_API_KEY}
      JWT_SECRET: ${JWT_SECRET}
      JWT_EXPIRES_IN: 7d
    depends_on:
      - postgres
    ports:
      - "3001:3001"
    volumes:
      - ./server/uploads:/app/uploads

  frontend:
    build: ./client
    restart: unless-stopped
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

#### 2. Deploy with Docker
```bash
# Create environment file
cp .env.example .env
# Edit .env with production values

# Build and start services
docker-compose up -d --build

# Check status
docker-compose ps

# View logs
docker-compose logs -f backend
```

---

### Option 3: Cloud Deployment (Heroku/DigitalOcean/AWS)

#### Heroku Deployment

1. **Prepare for Heroku**
```bash
# Install Heroku CLI
npm install -g heroku

# Login to Heroku
heroku login

# Create app
heroku create whatsai-app

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:hobby-dev

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-secret-key
heroku config:set EVOLUTION_API_URL=your-evolution-api-url
heroku config:set EVOLUTION_API_KEY=your-api-key
```

2. **Configure Package.json**
```json
{
  "scripts": {
    "heroku-postbuild": "cd client && npm install && npm run build",
    "start": "cd server && npm start"
  },
  "engines": {
    "node": "18.x"
  }
}
```

3. **Deploy**
```bash
git add .
git commit -m "Deploy to Heroku"
git push heroku main

# Run database migrations
heroku run npx prisma db push --app whatsai-app
```

---

## 🔧 Environment Variables Reference

### Required Variables
```env
# Application
NODE_ENV=production|development
PORT=3001

# Database
DATABASE_URL=your_database_connection_string

# Evolution API
EVOLUTION_API_URL=http://your-evolution-api
EVOLUTION_API_KEY=your-api-key

# Security
JWT_SECRET=your-secret-key-min-32-characters
JWT_EXPIRES_IN=7d
```

### Optional Variables
```env
# Admin User
DEFAULT_ADMIN_EMAIL=admin@yourdomain.com
DEFAULT_ADMIN_PASSWORD=secure-password

# Logging
LOG_LEVEL=info|debug|error
DEBUG=whatsai:*

# CORS
CORS_ORIGIN=https://yourdomain.com

# File Upload
MAX_FILE_SIZE=10485760

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## 🔐 Security Checklist

### Pre-Deployment Security
- [ ] Change default admin password
- [ ] Use strong JWT secret (32+ characters)
- [ ] Enable HTTPS/SSL certificates
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Use environment variables for secrets
- [ ] Enable firewall (only necessary ports)
- [ ] Regular security updates

### Post-Deployment Security
- [ ] Monitor application logs
- [ ] Set up automated backups
- [ ] Configure monitoring/alerts
- [ ] Regular security audits
- [ ] Keep dependencies updated

---

## 📊 Monitoring & Maintenance

### Application Monitoring
```bash
# PM2 monitoring
pm2 monit

# Check application status
pm2 status

# View logs
pm2 logs whatsai-backend

# Restart application
pm2 restart whatsai-backend
```

### Database Maintenance
```bash
# Backup database
pg_dump whatsai_db > backup_$(date +%Y%m%d).sql

# Monitor database size
psql -d whatsai_db -c "SELECT pg_size_pretty(pg_database_size('whatsai_db'));"
```

### System Monitoring
```bash
# Check disk space
df -h

# Check memory usage
free -h

# Check CPU usage
top

# Check network connections
netstat -tlnp | grep :3001
```

---

## 🚨 Troubleshooting

### Common Issues

1. **Application Won't Start**
```bash
# Check logs
pm2 logs whatsai-backend --lines 50

# Check port availability
sudo netstat -tlnp | grep :3001

# Check environment variables
printenv | grep -E "(NODE_ENV|PORT|DATABASE_URL)"
```

2. **Database Connection Issues**
```bash
# Test database connection
psql -d $DATABASE_URL -c "SELECT 1;"

# Check Prisma client
cd server && npx prisma db pull
```

3. **Evolution API Connection Issues**
```bash
# Test Evolution API
curl -I $EVOLUTION_API_URL
curl -X GET "$EVOLUTION_API_URL/instance/fetchInstances" \
  -H "apikey: $EVOLUTION_API_KEY"
```

---

## 📈 Performance Optimization

### Backend Optimization
- Enable gzip compression
- Use Redis for session storage
- Implement caching strategies
- Database query optimization
- Connection pooling

### Frontend Optimization
- Enable Nginx gzip compression
- Set proper cache headers
- Use CDN for static assets
- Implement service worker
- Bundle optimization

### Example Nginx Performance Config
```nginx
# Enable gzip compression
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

# Cache static assets
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

---

## 🔄 Update Process

### Application Updates
```bash
# Pull latest code
git pull origin main

# Update dependencies
cd server && npm ci
cd ../client && npm ci

# Build application
cd ../client && npm run build
cd ../server && npm run build

# Restart services
pm2 restart whatsai-backend

# Run any new migrations
npx prisma db push
```

### Zero-Downtime Updates
```bash
# Start new instance
pm2 start ecosystem.config.js --env production --name whatsai-backend-new

# Switch traffic (update Nginx config)
# Stop old instance
pm2 delete whatsai-backend

# Rename new instance
pm2 restart whatsai-backend-new --name whatsai-backend
```

---

This deployment guide covers development, production, and cloud deployment scenarios. Choose the option that best fits your infrastructure needs.