#!/bin/bash

# Pilana v2 Deployment Script
echo "🚀 Deploying Pilana App to production..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "📝 Please copy env.example to .env and configure it:"
    echo "   cp env.example .env"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "🗄️ Running database migrations..."
npx prisma migrate deploy

# Seed admin user
echo "👤 Seeding admin user..."
npm run db:seed

# Build the application
echo "📦 Building application..."
npm run build

# Deploy na Vercel
echo "🌐 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment completed!"
echo "🌍 Your app is now live!"
echo ""
echo "📋 Login credentials:"
echo "   - Edin / edin123 (admin)"
echo "   - EdinA / edina123 (user)" 