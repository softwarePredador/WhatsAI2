#!/bin/bash

# Get token from database (simulating logged in user)
TOKEN=$(node -e "
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();

async function getToken() {
  try {
    const user = await prisma.user.findFirst();
    if (!user) {
      console.error('No user found');
      process.exit(1);
    }
    
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'whatsai-secret-key-development',
      { expiresIn: '7d' }
    );
    
    console.log(token);
    await prisma.\$disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

getToken();
" 2>&1 | tail -1)

echo "Testing /api/plans/current..."
curl -X GET http://localhost:3000/api/plans/current \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n"

echo -e "\n\nTesting /api/plans/usage..."
curl -X GET http://localhost:3000/api/plans/usage \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n"
