@echo off
echo 🚀 Starting Pilana v2 deployment...

REM Check if .env exists
if not exist .env (
    echo ❌ .env file not found!
    echo 📝 Please copy env.example to .env and configure it:
    echo    copy env.example .env
    pause
    exit /b 1
)

REM Install dependencies
echo 📦 Installing dependencies...
call npm install

REM Generate Prisma client
echo 🔧 Generating Prisma client...
call npx prisma generate

REM Run database migrations
echo 🗄️ Running database migrations...
call npx prisma migrate deploy

REM Seed admin user
echo 👤 Seeding admin user...
call npm run db:seed

REM Build the application
echo 🏗️ Building application...
call npm run build

REM Start the application
echo ✅ Deployment completed!
echo 🌐 Starting application on http://localhost:3000
call npm start 