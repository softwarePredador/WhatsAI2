#!/bin/bash

# WhatsAI2 - Quick Start Script for Mac/Linux
# Author: Rafael Halder
# Date: 2025-10-29

set -e

echo "🚀 WhatsAI2 Quick Start for Mac/Linux"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check Node.js version
echo -e "${YELLOW}🔍 Checking Node.js version...${NC}"
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js 18+ required. Current: $(node -v)${NC}"
    echo -e "${YELLOW}Install via: brew install node@18${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js version: $(node -v)${NC}"

# Check if server/.env exists
echo ""
echo -e "${YELLOW}🔍 Checking .env configuration...${NC}"
if [ ! -f "server/.env" ]; then
    echo -e "${YELLOW}⚠️  server/.env not found. Creating from example...${NC}"
    cp server/.env.example server/.env
    echo -e "${RED}❗ Please edit server/.env with your credentials${NC}"
    echo -e "${YELLOW}   Run: nano server/.env${NC}"
    exit 1
fi
echo -e "${GREEN}✅ .env configuration found${NC}"

# Check if node_modules exists
echo ""
echo -e "${YELLOW}🔍 Checking dependencies...${NC}"
if [ ! -d "node_modules" ] || [ ! -d "server/node_modules" ] || [ ! -d "client/node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm run install:all
    echo -e "${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "${GREEN}✅ Dependencies already installed${NC}"
fi

# Check if Prisma is initialized
echo ""
echo -e "${YELLOW}🔍 Checking database...${NC}"
if [ ! -d "server/node_modules/.prisma" ]; then
    echo -e "${YELLOW}📊 Initializing Prisma...${NC}"
    cd server
    npm run db:generate
    npm run db:push
    cd ..
    echo -e "${GREEN}✅ Database initialized${NC}"
else
    echo -e "${GREEN}✅ Database already configured${NC}"
fi

# Clean ports
echo ""
echo -e "${YELLOW}🧹 Cleaning ports...${NC}"
npm run kill:ports
echo -e "${GREEN}✅ Ports cleaned${NC}"

# Check if ngrok is installed
echo ""
echo -e "${YELLOW}🔍 Checking ngrok...${NC}"
if command -v ngrok &> /dev/null; then
    echo -e "${GREEN}✅ ngrok installed${NC}"
    NGROK_INSTALLED=true
else
    echo -e "${YELLOW}⚠️  ngrok not installed${NC}"
    echo -e "${YELLOW}   Install via: brew install ngrok${NC}"
    echo -e "${YELLOW}   Or run without ngrok: npm run dev:no-tunnel${NC}"
    NGROK_INSTALLED=false
fi

# Ask user how to start
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🎉 Ready to start!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Choose startup mode:"
echo "1) Full mode (backend + frontend + ngrok)"
echo "2) Local mode (backend + frontend only)"
echo "3) Backend only"
echo "4) Frontend only"
echo ""
read -p "Enter choice [1-4]: " choice

case $choice in
    1)
        if [ "$NGROK_INSTALLED" = true ]; then
            echo -e "${GREEN}🚀 Starting full mode...${NC}"
            npm run dev
        else
            echo -e "${RED}❌ ngrok not installed. Using local mode instead...${NC}"
            npm run dev:no-tunnel
        fi
        ;;
    2)
        echo -e "${GREEN}🚀 Starting local mode...${NC}"
        npm run dev:no-tunnel
        ;;
    3)
        echo -e "${GREEN}🚀 Starting backend only...${NC}"
        npm run dev:server
        ;;
    4)
        echo -e "${GREEN}🚀 Starting frontend only...${NC}"
        npm run dev:client
        ;;
    *)
        echo -e "${RED}Invalid choice. Exiting...${NC}"
        exit 1
        ;;
esac
