@echo off
title SalonPro Localhost Setup

echo.
echo 🏪 SalonPro - Localhost Setup Script
echo ====================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node --version') do set NODE_VERSION=%%v
echo ✅ Node.js found: %NODE_VERSION%

REM Check if PostgreSQL is installed
psql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ PostgreSQL is not installed. Please install PostgreSQL first.
    echo    Download from: https://www.postgresql.org/download/windows/
    pause
    exit /b 1
)

echo ✅ PostgreSQL found

REM Install dependencies
echo.
echo 📦 Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo ✅ Dependencies installed

REM Create .env file if it doesn't exist
if not exist ".env" (
    echo.
    echo ⚙️ Creating environment configuration...
    copy .env.example .env >nul
    
    REM Update .env with localhost database URL
    powershell -Command "(gc .env) -replace 'DATABASE_URL=.*', 'DATABASE_URL=postgresql://salon_user:salon_password_123@localhost:5432/salon_db' | Out-File -encoding ASCII .env"
    powershell -Command "(gc .env) -replace 'NODE_ENV=.*', 'NODE_ENV=development' | Out-File -encoding ASCII .env"
    
    echo ✅ Environment file created
) else (
    echo ✅ Environment file already exists
)

REM Create database setup SQL
echo.
echo 📝 Creating database setup script...
(
echo -- Create database and user for SalonPro
echo CREATE DATABASE salon_db;
echo CREATE USER salon_user WITH PASSWORD 'salon_password_123';
echo GRANT ALL PRIVILEGES ON DATABASE salon_db TO salon_user;
echo ALTER USER salon_user CREATEDB;
) > setup_database.sql

echo.
echo 🗄️ Database setup instructions:
echo 1. Open Command Prompt as Administrator
echo 2. Run: psql -U postgres
echo 3. Execute: \i setup_database.sql
echo 4. Exit: \q
echo.
echo Or run this command to setup database:
echo psql -U postgres -f setup_database.sql
echo.

set /p choice="Do you want to attempt automatic database setup? (y/N): "
if /i "%choice%"=="y" (
    echo.
    echo 🗄️ Setting up database...
    
    REM Try to create database automatically
    psql -U postgres -f setup_database.sql
    
    if %errorlevel% equ 0 (
        echo ✅ Database setup completed
        
        REM Initialize database schema
        echo.
        echo 📊 Initializing database schema...
        call npm run db:push
        
        if %errorlevel% equ 0 (
            echo ✅ Database schema initialized
        ) else (
            echo ❌ Failed to initialize database schema
            echo Please run: npm run db:push
        )
    ) else (
        echo ❌ Database setup failed. Please setup manually:
        echo 1. psql -U postgres
        echo 2. CREATE DATABASE salon_db;
        echo 3. CREATE USER salon_user WITH PASSWORD 'salon_password_123';
        echo 4. GRANT ALL PRIVILEGES ON DATABASE salon_db TO salon_user;
        echo 5. \q
        echo 6. npm run db:push
    )
)

echo.
echo 🎉 Setup completed!
echo.
echo To start the application:
echo   npm run dev
echo.
echo Then open your browser to: http://localhost:5000
echo.
echo Default login credentials:
echo   Email: admin@salon.com
echo   Password: admin123
echo.
echo For detailed setup instructions, see: LOCALHOST_SETUP.md
echo.
pause