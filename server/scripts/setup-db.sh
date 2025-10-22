#!/bin/bash

echo "🗄️  Setting up WhatsAI Database..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  DATABASE_URL not set. Using default PostgreSQL connection."
    export DATABASE_URL="postgresql://whatsai:whatsai123@localhost:5432/whatsai"
fi

echo "📦 Installing dependencies..."
npm install

echo "🔧 Generating Prisma client..."
npm run db:generate

echo "🗃️  Creating database and running migrations..."
npm run db:push

echo "✅ Database setup complete!"
echo ""
echo "🚀 To start the application:"
echo "   npm run dev"
echo ""
echo "📊 To open Prisma Studio:"
echo "   npm run db:studio"