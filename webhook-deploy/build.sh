#!/bin/bash
echo "🔧 Instalando dependências..."
npm install

echo "🗄️ Configurando Prisma..."
npx prisma generate

echo "📋 Sincronizando banco..."
npx prisma db push

echo "✅ Build concluído!"